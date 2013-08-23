/*
 * dto = { before: "", num: "", after: "" }
 */
function NumLabel(dto) {
	if (!dto)
		dto = { before: "", num: "", after: "" };
	this.before = dto.before.toString();
	this.num = dto.num.toString();
	this.after = dto.after.toString();
}

NumLabel.prototype.toString = function () {
	return this.before + this.num + this.after;
}

/* cons - Custom Outline Numbering Services
 */
var cons = (function (NumLabel) {

	var api = {};
	api.getLabel = getLabel;
	api.getLabels = getLabels;
	return api;

	/*
	 *
	 *	var dto = {
	 *				type: "chiasm",
	 *				concepts: [
	 *						{ content: "a1" },
	 *						{ content: "a2", type: "seq" }
	 *				]
	 *			};
	 */
	function getLabel(dto, index) {
		if (dto.type == "chiasm") {
			var labels = getLabels(dto, index);
			return labels[index];
		}
		return -1;
	}

	function labelToString(label) {
		return label.before + label.num + label.after;
	}

	function getLabels(dto, indexToStop) {
		var labels = [];
		if (!indexToStop)
			indexToStop = dto.concepts.length - 1;
		if (dto.type == "chiasm") {
			var embedded = { parentEnum: "", parentEndMarker: "", total: 0, currentCount: 0 };
			var mainlineIndex = -1;
			for (var i = 0; i <= indexToStop; i++) {
				var concept = dto.concepts[i];
				var label = new NumLabel();
				if (!concept.embeddedType || concept.embeddedType == "panel" && concept.isHead) {
					mainlineIndex++;
					var chr = IndexToAsciiMarkerABA(mainlineIndex, dto.concepts.length - embedded.total);
					var endchar = GetEndMarkerABA(mainlineIndex, dto.concepts.length - embedded.total);
					embedded.parentEndMarker = endchar;
					embedded.parentEnum = chr;
					embedded.currentCount = 0;
					if (concept.embeddedType == "panel" && concept.isHead) {
						embedded.currentCount++;
						embedded.total++;
						chr = chr + "1";
					}				
					label.num = chr;
					label.after = endchar;
				}
				else if (concept.embeddedType == "panel") {
					embedded.currentCount++;
					label.num = embedded.parentEnum + embedded.currentCount;
					label.after = embedded.parentEndMarker;
					embedded.total++;
				}
				labels.push(label);
			}
		}
		return labels;
	}

function GetEndMarkerABA(index, count) {
	var halfway = Math.round(count / 2);
	var endchar;
	if (index < halfway)
		endchar = ".";
	else
		endchar = "'";
	return endchar;
}

function OutlineItemLabelerConfig() {
	return { AsciiA: 65 };
}

function IndexToAsciiMarkerABA(index, numChiasmItems) {
	var c = OutlineItemLabelerConfig();
	return String.fromCharCode(c.AsciiA + offsetFromClosestEnd(index, numChiasmItems));
}

function offsetFromClosestEnd(index, numChiasmItems) {
	var halfway = numChiasmItems / 2;
	var asciiMarker;
	if (index < halfway) {
		return index;
	}
	else {
		//0 1 2           3            4
		// 0 1 2 1(5 - 3 - 1) 0(5 - 4 - 1)
		return numChiasmItems - index - 1;
	}
}

function IndexToAsciiMarkerAAB(index) {
	var c = OutlineItemLabelerConfig();
	var alphabetIndex = Math.floor(index / 2);
	asciiMarker = String.fromCharCode(c.AsciiA + alphabetIndex);
	return asciiMarker;
}

function GetEndMarkerAAB(index) {
	var endchar;
	if (index % 2 == 0)
		endchar = ".";
	else
		endchar = "'";
	return endchar;
}
})(NumLabel);