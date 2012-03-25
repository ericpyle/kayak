// http://stackoverflow.com/questions/454202/creating-a-textarea-with-auto-resize
// http://forums.asp.net/p/1373154/2877899.aspx
// <textarea  cols="80" rows="1" id="text-level-A" onkeyup="FitToContent('text-level-A','','100');" style="overflow:hidden;">
// </textarea>

function FitToContent(id, maxHeight, minHeight) {
   var text = id && id.style ? id : document.getElementById(id);
   //alert("id(" + id + ")text (" + text +")");
   if (!text) return;
   // first shrink before expanding to fit content
   //alert("text.style.height(" + text.style.height + ")");
   text.style.height = "20px";
   var adjustedHeight = text.clientHeight;
   //alert("clientHeight(" + text.clientHeight + ")scrollHeight(" + text.scrollHeight + ")");
   if (!maxHeight || maxHeight > adjustedHeight) {
       adjustedHeight = Math.max(text.scrollHeight, adjustedHeight);
       if (maxHeight)
           adjustedHeight = Math.min(maxHeight, adjustedHeight);
       if (adjustedHeight > text.clientHeight)
           text.style.height = adjustedHeight + "px";
   }
   // trim the text back
   //text.value = text.value.substring(0, text.value.length - 1);
   //            
   //            if (!minHeight || minHeight < adjustedHeight) {
   //                adjustedHeight = Math.max(text.clientHeight, text.scrollHeight);
   //                if (minHeight)
   //                    adjustedHeight = Math.max(minHeight, text.scrollHeight);
   //                if (adjustedHeight < text.clientHeight)
   //                    text.style.height = adjustedHeight + "px";
   //            }
}
//function GetClientId() {
//    var tb = document.getElementById("< %= cdcatalog.FindControl('headingBox').ClientID % >");
//    alert("The textbox id is: " + tb.id);
//    return tb.id;
//};
function FitToContentFromTemplate(index, id, maxHeight, minHeight) {
   alert("index/id/max/min: " + index + " " + id + " " + maxHeight + " " + minHeight);
   // var txt1 = document.getElementById('<%= GetControlClientIdFromTemplate("txt1", 0) %>');
   // 
   var dynId = "<%= cdcatalog.Items[" + index + "].FindControl('" + id + "').ClientID %>";
   //var dynId = "<%= GetControlClientIdFromTemplate('" + id + "') %>";
   alert("dynamic server id: " + dynId);
   FitToContent(dynId, maxHeight, minHeight);
}