
var init=function(){
  if("chrome-extension://ppllaldmfiehahhbjdjhemljnmibehnk"!=window.location.origin)
    document.head.innerHTML="";
  document.body.innerHTML="";
  var wlh=/[\?|\&]q=([^\&]*)/.exec(window.location.href);

  if(wlh){
    var key=Math.random().toString();
    chrome.runtime.onMessage.addListener(function(request,send,res){
      if(key!=request.key){
        return;}
      var fwdedonce=/\&fwdedonce=1/.test(window.location.href);
      if(!fwdedonce&&request.results.length){
        window.history.replaceState({query:wlh[1]},"fwdedonce","/search?q="+wlh[1]+"");
        window.setTimeout(function(){
          window.location=request.results[0].url;
        },1);
      } else if(!fwdedonce&&!request.results.length){
        window.history.replaceState({query:wlh[1]},"fwdedonce","/search?q="+wlh[1]+"");
        window.setTimeout(function(){
          window.location.reload();
        },1);
      } else{
        make_page();
        display_all(request.results);
      }
    });
    chrome.runtime.sendMessage({"action":"search","query":wlh[1],"key":key});
  } else{
    make_page();
    document.querySelector("input[name=q]").focus();
  }
};



var display_all=function(msg){
  var rloc=document.getElementById("resin");
  if(!rloc){
    var rloc=document.createElement("div");
    document.body.appendChild(rloc);
    rloc.id="resin";
  }
  rloc.innerHTML="";
  for (var i = 0; i < msg.length; i++) {
    rloc.appendChild(aobj(msg[i]));
    rloc.appendChild(nbr());
  };
};

var aobj=function(ad){
  var o=document.createElement("a");
  o.href=ad.url;o.innerText=ad.txt;
  return o;
};
var nbr=function(){
  return document.createElement("br");
}
var array_copy=function(arr){
  var na=[];
  for (var i = 0; i < arr.length; i++) {
    na.push(arr[i]);
  };
  return na;
};
var x16=function(s){
  var map="0123456789ABCDEF";
  var out=0;
  for (var i = 0; i < s.length; i++) {
    out*=16
    out+=map.indexOf(s[i]);
  };
  return out;
};
var make_page=function(){
  var d={"tn":"div","a":{"id":"sform"},"c":null};
  d.c=[{"tn":"form","a":{"action":"search","method":"get"},"c":[]}];
  d.c[0].c=[{"tn":"input","a":{"type":"text","name":"q"}},{"tn":"input","a":{"type":"submit","value":"Search"}}];
  m_note={"tn":"div","a":{"class":"what_is"}};
  d.c.push(m_note);
  var m_note={"tn":"div","a":{"class":"what_is_restore"}};
  d.c.push(m_note);
  delete m_note;
  var sbox=json_to_dom(d);delete d;
  var wic=sbox.querySelector(".what_is");
  var wi_r=sbox.querySelector(".what_is_restore");
  chrome.runtime.sendMessage({"action":"show_help"},function(r){
    if(r.show)
      make_what_is(wic);
    else
      make_what_is_restore(wi_r);
  });
  document.body.appendChild(sbox);
};
var make_what_is_restore=function(rp){
  var restore_link=aobj({url:"restore",txt:"Help"});
  rp.appendChild(restore_link);
  restore_link.addEventListener("click",function(){
    arguments[0].preventDefault();
    chrome.runtime.sendMessage({"action":"hide_forever","hide":false});
    make_what_is(document.querySelector(".what_is"));
    document.querySelector(".what_is_restore").innerHTML="";
  },false);
};

var make_what_is=function(wic){
  wic.innerHTML="<p>You may search directly from this page, but I recommend <strong>right clicking the search box,</strong> and adding it as a search engine.<p>If you like the functionality, and would like to use this as your default search you can enter <a>Settings</a><p>Scroll to <strong>Search.</strong><p> Click <strong>Manage Search Engines…</strong><p>From there locate the Search Engine entry created by this extension, hover over it and click <strong>Make default</strong> on the right<p><a id=hide_frvr>Hide help</a>";
  
  var s_link=wic.querySelector("a");
  s_link.href='chrome://settings/';
  s_link.target="_blank";
  s_link.addEventListener("click",function(){
    arguments[0].preventDefault();
    chrome.runtime.sendMessage({"action":"fwdme","url":"chrome://settings/searchEngines"});
  },false);
  s_link.innerHTML="Settings";

  var h_link=wic.querySelector("a#hide_frvr");
  h_link.href="hide_forever";
  h_link.addEventListener("click",function(){
    arguments[0].preventDefault();
    chrome.runtime.sendMessage({"action":"hide_forever","hide":true});
    wic.innerHTML="";
    make_what_is_restore(document.querySelector(".what_is_restore"));
  },false);
};

var json_to_dom=function(injson){
  var root=document.createElement(injson.tn);
  if(injson.a){
    var a_a=Object.keys(injson.a);
    for (var i = 0; i < a_a.length; i++) {
      if(a_a[i]=="class")
        root.className=injson.a[a_a[i]];
      else
        root.setAttribute(a_a[i],injson.a[a_a[i]]);
    };
  }
  if(injson.c)
    for (var i = 0; i < injson.c.length; i++) {
      var no=json_to_dom(injson.c[i]);
      root.appendChild(no);
    };
  return root;
};


document.addEventListener("DOMContentLoaded",init,false);