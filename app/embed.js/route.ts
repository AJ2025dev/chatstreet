const EMBED = `(function(){
  var script=document.currentScript;
  if(!script)return;
  var src=new URL(script.src);
  var base=src.origin;
  var campaign=script.dataset.campaign||"aera-x-2026";
  var publisher=script.dataset.publisher||location.hostname;
  var mode=script.dataset.mode||"floating";
  var frame=document.createElement("iframe");
  var pageUrl=encodeURIComponent(location.href);
  var pageTitle=encodeURIComponent(document.title);
  frame.src=base+"/widget?campaign="+encodeURIComponent(campaign)+"&publisher="+encodeURIComponent(publisher)+"&mode="+encodeURIComponent(mode)+"&pageUrl="+pageUrl+"&pageTitle="+pageTitle;
  frame.title="ChatStreet contextual assistant";
  frame.setAttribute("aria-label","ChatStreet contextual assistant");
  frame.setAttribute("allow","clipboard-write");
  frame.style.border="0";
  frame.style.background="transparent";
  frame.style.zIndex="2147483000";
  frame.style.transition="height .22s ease,width .22s ease";
  if(mode==="inline"){
    frame.style.width=script.dataset.width||"100%";
    frame.style.maxWidth=script.dataset.maxWidth||"420px";
    frame.style.height=script.dataset.height||"620px";
    frame.style.display="block";
    frame.style.margin=script.dataset.align==="left"?"0":script.dataset.align==="right"?"0 0 0 auto":"0 auto";
    script.parentNode.insertBefore(frame,script.nextSibling);
  }else{
    frame.style.position="fixed";
    frame.style.right=script.dataset.right||"20px";
    frame.style.bottom=script.dataset.bottom||"20px";
    frame.style.width="min(410px, calc(100vw - 20px))";
    frame.style.height="650px";
    frame.style.maxHeight="calc(100vh - 20px)";
    document.body.appendChild(frame);
  }
  window.addEventListener("message",function(event){
    if(event.origin!==base||!event.data||event.data.source!=="chatstreet")return;
    if(event.data.type==="resize"&&mode!=="inline"){
      frame.style.height=Math.min(event.data.height||650,window.innerHeight-20)+"px";
      frame.style.width=event.data.open?"min(410px, calc(100vw - 20px))":"260px";
    }
    if(event.data.type==="event"){
      window.dispatchEvent(new CustomEvent("chatstreet:event",{detail:event.data}));
    }
  });
})();`;

export function GET() {
  return new Response(EMBED, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
