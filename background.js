
var d=document.implementation.createHTMLDocument();


var msg_map={};

msg_map["search"]=function(request, sender, sendResponse) {
  if(request&&request.query){
    runsearch(request.query,function(data){
      var nreq={results:data,key:request.key};
      chrome.tabs.sendMessage(sender.tab.id,nreq);
    });
  }
};

var array_copy=function(arr){
  var na=[];
  for (var i = 0; i < arr.length; i++) {
    na.push(arr[i]);
  };
  return na;
};
var now=function(){
  return (new Date()).getTime();
};
msg_map["fwdme"]=function(request,sender,sendResponse){
  if(request&&request.url)
    chrome.tabs.update(sender.tab.id,{"url":request.url});
};

var opt_db=indexedDB.open("opt_db",5);
opt_db.only_store_name="ext_opts";
opt_db.onupgradeneeded=function(){
  var osname=opt_db.only_store_name;
  var odb=opt_db.result;
  if(!odb.objectStoreNames.contains(osname)){
    odb.createObjectStore(osname,{keyPath:"name",autoIncrement:false})
  }
};
opt_db.onsuccess=function(evt){
  var odb=opt_db.result;
  opt_db.done=true;
  while(opt_db.r_queue.length){
    var nr=opt_db.r_queue.shift();
    opt_db[nr.method].apply(opt_db,nr.args);
  }
};
opt_db.r_queue=[];
opt_db.__store=function(k,v){
  var odb=opt_db.result;
  var osname=opt_db.only_store_name;

  var t=odb.transaction([osname],"readwrite");
  var os=t.objectStore(osname);
  os.put({name:k,val:v,ts:now()});
};
opt_db.__get=function(k,cb){
  var odb=opt_db.result;
  var osname=opt_db.only_store_name;

  var t=odb.transaction([osname],"readwrite");
  var os=t.objectStore(osname);
  var gr=os.get(k);
  gr.onsuccess=function(){
    cb(gr.result);
  };
};
opt_db.later=function(nm){
  return function(){
    if(opt_db.done===true)
      opt_db["__"+nm].apply(opt_db,array_copy(arguments));
    else
      opt_db.r_queue.push({method:"__"+nm,args:array_copy(arguments)});
  };
}
opt_db.store=opt_db.later("store");
opt_db.get=opt_db.later("get");

var to_hide_help={v:false,ts:now(),source:"default"};

opt_db.get("hide_help_forever",function(r){
  if(r===undefined)
    return;
  if(to_hide_help.source!="user"){
    to_hide_help.v=r.val;
    to_hide_help.ts=r.ts;
    to_hide_help.source="db";
  }
});
msg_map["hide_forever"]=function(request,sender,sendResponse){
  var nv=(request.hide===true);
  if(now()>to_hide_help.ts){
    to_hide_help.v=nv;
    to_hide_help.ts=now();
    to_hide_help.source="user";
    opt_db.store("hide_help_forever",nv);
  }
};
msg_map["show_help"]=function(request,sender,sendResponse){
  sendResponse({show:!to_hide_help.v});
};

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if(sender.id!=chrome.runtime.id)
    return false;
  if(request&&request.action&&msg_map[request.action]){
    msg_map[request.action].apply(null,array_copy(arguments));
  }
});

var scache={};
var stime={};


var add_to_cache=function(key,data){
  var ts=now();
  scache[key]=data;
  stime[key]=ts;
  var expire=(function(k,time_stamp){
    return function(){
      if(stime[k]==time_stamp){
        delete scache[k];
        delete stime[k];
      }
    };
  })(key,ts);

  setTimeout(expire,1000*60*5);
};
var wo_space=function(txt){
  while(/ /g.test(txt))
    txt=txt.replace(/ /g,"+");
  return txt;
}


var runsearch=function(txt,callback){
  txt=wo_space(txt);

  if(txt in scache)
    return callback(scache[txt]);

  var xhr=new XMLHttpRequest();
  xhr.onreadystatechange=function(){
    if(this.readyState==4){
      if(this.status!=200)
        return callback([]);
      
      var resout=find_results(this.responseText);
      callback(resout);
      add_to_cache(txt,resout);
      return;
    }
  };
  xhr.open("GET","https://www.google.com/search?q="+txt);
  xhr.setRequestHeader("XMLHTTPRequest","");
  xhr.setRequestHeader("accept","text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8");
  xhr.send();
  setTimeout(function(){
    if(xhr.readyState!=4){
      xhr.abort();
    }
  },3000);
};

var find_results=function(rtxt){
  var background_div=d.createElement("div");
  background_div.innerHTML=rtxt;
  var scr=background_div.querySelectorAll("h3.r a");
  var resout=[];
  for (var i = 0; i < scr.length; i++) {
    resout.push({url:scr[i].href,txt:scr[i].innerText});
  };
  return resout;
};

if(chrome.omnibox){
  chrome.omnibox.setDefaultSuggestion({"description":"Give me a search term"});
  chrome.omnibox.onInputEntered.addListener(function(intxt){
    intxt=wo_space(intxt);
    chrome.tabs.update(undefined,{"url":"https://www.google.com/imfeelingluckyextension/search?q="+intxt});
  });
}