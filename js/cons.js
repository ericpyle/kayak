/*
 * Imports
 *	offsetFromClosestEnd
 */

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
	api.createDtoFromOutline = createDtoFromOutline;
	api.createDtoFromConcepts = createDtoFromConcepts;
	api.convertLabelToLevel = convertLabelToLevel;
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
	function createDtoFromOutline(outline) {
		var dto = { type: "", concepts: [] };
		if (outline)
			dto = createDtoFromConcepts(outline.head.contentType, outline.body.concepts);
		return dto;
	}

	function createDtoFromConcepts(type, concepts) {
		var dto = { type: "", concepts: [] };
		dto.type = type;
		if (concepts)
			dto.concepts = clone(concepts);
		return dto;
	}

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
					label = getChiasmLabel(mainlineIndex, dto.concepts.length - embedded.total);
					var chr = label.num;
					var endchar = label.after;
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

	function getChiasmLabel(index, count) {
		var chr = IndexToAsciiMarkerABA(index, count);
		var endchar = GetEndMarkerABA(index, count);
		var label = new NumLabel();
		label.num = chr;
		label.after = endchar;
		return label;
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

function convertLabelToLevel(label) {
	var baseChar = label.num.charAt(0); // review: this assumes first character is sufficient
	if (baseChar >= "A" && baseChar <= "Z") 
		return baseChar.charCodeAt(0) - "A".charCodeAt(0);
	return 0;
}

function IndexToAsciiMarkerABA(index, numChiasmItems) {
	return String.fromCharCode("A".charCodeAt(0) + offsetFromClosestEnd(index, numChiasmItems));
}

/* Obsolete?
function IndexToAsciiMarkerABA(index, numChiasmItems) {
	var isEven = numChiasmItems % 2 == 0;
	var halfway = numChiasmItems / 2;
	var asciiMarker;
	if (index < halfway) {
		asciiMarker = String.fromCharCode(AsciiA + index);
	}
	else {
		//0 1 2           3            4
		// 0 1 2 1(5 - 3 - 1) 0(5 - 4 - 1)
		asciiMarker = String.fromCharCode(AsciiA + (numChiasmItems - index - 1));
	}
	return asciiMarker;
} 
*/

function IndexToAsciiMarkerAAB(index) {
	var alphabetIndex = Math.floor(index / 2);
	asciiMarker = String.fromCharCode("A".charCodeAt(0) + alphabetIndex);
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