/**
 * @author various
 */

	/*
	 * Utility
	 */
	function AorB(a, b)
	{
		return a ? a : b; 
	}
	
	/*
	 * Utility
	 */
	function clone(obj)
	{
		return jQuery.parseJSON(JSON.stringify(obj));
	}
	
	
	/*
	 * Utility
	 */
	function jq(myid) { 
		return '#' + myid.replace(/(:|\.|\*|@|\+|\/)/g,'\\$1');
	}
	
	function EmptyIfNull(s)
	{
		return s ? s : "";
	}
	
	function doTestAndDoSomething(sequence, doTest, doSomething)
	{
		var indexOfFind = -1;
		for (var i=0; i < sequence.length; i++) {
		  	if (doTest(sequence[i]))
		  	{
		  		indexOfFind = i;
		  		break;
		  	}
		};
		if (indexOfFind >= 0)
		{
			if (doSomething)
				doSomething(sequence, indexOfFind);
			return true;
		}
		return false;
	}

	/*
	 * http://sirdarckcat.blogspot.com/2007/07/passing-reference-to-javascript.html
	 */
	function modifyVar(obj,val){
		obj.valueOf=obj.toSource=obj.toString=function(){return val}
	}

	// $('#elem').selectRange(3,5);
	$.fn.selectRange = function(start, end) {
	    return this.each(function() {
	        if (this.setSelectionRange) {
	            this.focus();
	            this.setSelectionRange(start, end);
	        } else if (this.createTextRange) {
	            var range = this.createTextRange();
	            range.collapse(true);
	            range.moveEnd('character', end);
	            range.moveStart('character', start);
	            range.select();
	        }
	    });
	};
	
	$.fn.putCursorAtEnd = function()
    {
	    return this.each(function()
	    {
	        $(this).focus()
	
	        // If this Function exists...
	        if (this.setSelectionRange)
	        {
	        // ... then use it
	        // (Doesn't work in IE)
	
	        // Double the length because Opera is inconsistent about whether a carriage return is one character or two. Sigh.
	        var len = $(this).val().length * 2;
	        if (len)
	        	this.setSelectionRange(len, len);
	        }
	        else
	        {
	        // ... otherwise replace the contents with itself
	        // (Doesn't work in Google Chrome)
	        $(this).val($(this).val());
	        }
	
	        // Scroll to the bottom, in case we're in a tall textarea
	        // (Necessary for Firefox and Google Chrome)
	        this.scrollTop = 999999;
	    });
    };
    
    // $('ol li').sort(sortAlpha).appendTo('ol');  
	function sortAlpha(a,b){  
	    return a.innerHTML > b.innerHTML ? 1 : -1;  
	};
	
		/*
	 * http://stackoverflow.com/questions/3562493/jquery-insert-div-as-certain-index
	 */
	jQuery.fn.insertAt = function(index, element) {
		//alert(lastIndex + this.html());
		var lastIndex = this.children().size();
		if (index < 0) {
			index = Math.max(0, lastIndex + 1 + index);
		}
		//alert("insertAt" + index + this.attr("id") + element);
		this.append(element);
		//alert(this.html());
		if (index < lastIndex) {
			this.children().eq(index).before(this.children().last());
		}
		return this;
	}

