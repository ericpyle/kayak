/**
 * @author Pyle
 */

function trimChiasm(textboxId, fStripCounting) {
	var textbox  = document.getElementById(textboxId);
	var str=textbox.value;
	var origlines= str.split('\n');
	var lines = [];
	for (x = 0; x < origlines.length; x++) {
		if (origlines[x] == "")
			continue;
		var pattm=/^\s*/;
		var ws = origlines[x].match(pattm)[0];
		var trimmed = origlines[x].substr(ws.length);
		if (trimmed != "")
			lines.push(trimmed);
	}
	var items = [];
	/*
	var fSkipfirst = false;
	
	if (lines.length >= 3) {

		if (lines[0].charAt(0).toLowerCase() == 'a' && 
			lines[lines.length -1].charAt(0).toLowerCase() == 'a' && 
			lines[1].charAt(0).toLowerCase() == 'b') 
		{
			var secondchar = lines[1].charAt(1);
			if (secondchar == " " ||
				secondchar == "." ||
				secondchar == "'" ||
				secondchar == "’" ||
				secondchar == ")") 
			{
				fSkipfirst = true;
			}
		}
	}
	*/
	for (x = 0; x < lines.length; x++) {
		var newItem = "";
		if (fStripCounting) {
			// regex skip first nonwhitespace then next whitespace
			var patt1=/^[^\s]+[\.\'\)\’]\s*/;
			var matches = lines[x].match(patt1);
			var marker = "";
			if (matches != null)
			 marker = matches[0];
			//alert(marker)	
			newItem = lines[x].substr(marker.length);
		} else {
			newItem = lines[x];
		}
		//alert(newItem)
		items.push(newItem);
	}
	//alert(items.length + ": " + items);
	return items;
}