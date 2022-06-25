
const selectedColor = "rgb(255, 250, 205)"
const alignedColor = "rgb(228, 233, 237)" //"rgb(177,197,212)"//"rgb(102, 205, 170)"//"rgb(60, 179, 113)" rgb(119, 136, 153)
const EBColor = "rgb(228, 233, 237)" //"rgb(177,197,212)" //"rgb(119, 136, 153)" //"rgb(102, 204, 204)" (46,139,87)
const insertModeColor = "rgb(237, 173, 128)"; //Alert Tan (light)
const borderOrigin = "1px dashed rgb(0, 0, 0)"//"6px solid rgb(128, 0, 0)"
const languages = ["Syriac", "Greek", "Latin"];
const borderBottomCategories = ["darkmagenta", "green", "blue", "red", "darkorange"];
const CAL_URL = "http://cal.huc.edu/getlex.php?coord=6050";

jQuery.fn.reverse = [].reverse;

$(document).ready(function() {
    // BLOCK: INITIAL SETUP

    // tooltip stuff
    $( function() {
      $( document ).tooltip();
    } );

    var lastP = null;
	  var noteTarget = null;
    var resetBorders = true;
    var referenceExport = $('#EB').index();
    var linkToFollow = null;

    // apply EB bgcolor
    $("#EB").css('background-color', EBColor);

    // remove spurious br
    $("#EB").children('br[type=\"_moz\"]').remove();

    $('.synopsis tr>td[id!="EB"]').each(function() { $(this).attr('allowInsert', 'false'); }); // read-only by default

    $('.context-menu-one').each(function() { $(this).removeClass("context-menu-one");});

    // quick fix in CAL text, temporary: rename a tags to z tags
    $('.synopsis a').each(function() {
      // Create a new element and assign it attributes from the current element
      var NewElement = $("<z />");
      $.each(this.attributes, function(i, attrib){
        $(NewElement).attr(attrib.name, attrib.value);
      });

      // Replace the current element with the new one and carry over the contents
      $(this).replaceWith(function () {
        return $(NewElement).append($(this).contents());
      });
    });

    // just a temp hack (probably no longer needed after 2020, Nov 24)
    $('textarea[id="textareaID"').replaceWith('<div id="textareaID" contenteditable="true" class="form-control" style="height:80px; overflow:auto; resize:vertical" />');

	// Set language labels for Note modal
	$(".modal-body #noteConcernedLanguages label").each(function(i) {
		$(this).html(languages[i]);
	});

  insertColorPalette();

	// inject class 'origin'
	$('.synopsis td:not([id="EB"]) > p').each(function(){
		if ( $(this).css('border') == borderOrigin ) {
      $(this).addClass('origin');
      $(this).style.border = ""
    }
	});

  // automatically scroll to end of EB and trigger align
  var myDiv = $("#EB > div");
  myDiv.scrollTop(myDiv.prop("scrollHeight") - myDiv.height());
  // myDiv.find('p:last').trigger('click'); // does not work
  selectSameSet(myDiv.find('p:last'));
  vAlignSameSet(myDiv.find('p:last'));

  // scroll to end of page
  $(window).load(function() {
    $("html, body").animate({ scrollTop: $(document).height() }, 1000);
  });

    // // getting input: copy-paste
    // $('[contenteditable=true]').on('paste', function (e) {
    //     //console.log("pasting no format")
    //     e.preventDefault();
    //     var cd =  e.originalEvent.clipboardData;
    //     var content = cd.getData("text/plain")
    //     $(this).append("<p>" + content + "</p>");
    // });

    // BLOCK: GENERAL FUNCTIONS
    $.fn.isInViewport = function() { //!! <!DOCTYPE HTML> is important for correct window height
      var elementTop = $(this).offset().top;
      var elementBottom = elementTop + $(this).outerHeight();
      var viewportTop = $(window).scrollTop();
      var viewportBottom = viewportTop + $(window).height();
      //return elementBottom > viewportTop && elementTop < viewportBottom;
      return elementTop > viewportTop && elementBottom < viewportBottom;
    };

    function isDoubleClicked(element) {
        //if already clicked return TRUE to indicate this click is not allowed
        if (element.data("isclicked")) return true;

        //mark as clicked for 1 second
        element.data("isclicked", true);
        setTimeout(function () {
            element.removeData("isclicked");
        }, 1000);

        //return FALSE to indicate this click was allowed
        return false;
    }

    function text_unselect(){
      if (window.getSelection) { // All browsers, except IE <=8
        window.getSelection().removeAllRanges();
      } else if (document.selection) { // IE <=8
        document.selection.empty();
      }
    }

    // (MAIN) BLOCK TEXT TO ALIGN >> LEFT-HAND SIDE
    function isAligned(pElement){
      var pId = pElement.attr('id');
      return (typeof pId !== typeof undefined && pId !== false) // id exists
    }

    function unselect(){
      $('tr td p[id]').filter(function() {
         return ( $(this).css('background-color') == selectedColor );
      }).css('background-color', alignedColor)

      $('tr td p').filter(function() { //the others in the selection
         return ( $(this).css('background-color') == selectedColor );
      }).css('background-color', 'inherit')

      $('tr td p[id]').css('background-color', alignedColor)
    }

    function select(thisObj){
      if (thisObj.text().length > 0) { // ignore empty para
        thisObj.css( "background-color", selectedColor)
      }
    }

    function undo_select(thisObj){
      if ( isAligned(thisObj) ) {
        thisObj.css( "background-color", alignedColor);
      }
  	  else {
  		thisObj.css( "background-color", 'inherit');
  	  }
    }

    function selectSwitch(thisObj){
  		if ( thisObj.css('background-color') == selectedColor ) {
  			undo_select(thisObj);
  		}
  		else {
  			select(thisObj);
  		}
    }

    function selectSameSet(thisObj){
      // highlight segments with same id
      var oldId = thisObj.attr('id');
      if (typeof oldId !== typeof undefined && oldId !== false) { // id exists
        $("p[id=" + oldId + "]").each(function() { select($(this)) });
      }
    }

    function vAlignSameSet(thisObj){
      // vertically align segments with same id (automatic scroll)

	    var oldId = thisObj.attr('id');

      if (typeof oldId !== typeof undefined && oldId !== false) { // id exists
        /* // do nothing if not first in the column
        if (thisObj.prevAll('[id = ' + oldId + ']').length) { return; } */

        var oldDelta = thisObj.offset().top - thisObj.parent('div').offset().top;
        $("td > div > p[id=" + oldId + "]").each(function() {
    			//console.log("ckecking: " + $(this).text());
    			//console.log("columns: " + $(this).closest("td").index() + " vs. " + thisObj.closest("td").index());
    			if ($(this).closest("td").index() == thisObj.closest("td").index()) { return true; } // ignore if in the same column
              if ($(this).prevAll('[id = ' + oldId + ']').length) { return true; } // continue (ignore if not first: only align _to_ the first)
              var newDelta = $(this).offset().top - $(this).parent('div').offset().top;

              // automatically scroll the div to aligned segment; add back initial delta
              $(this).parent('div').scrollTop(
                $(this).parent('div').scrollTop() + newDelta - oldDelta
              )
        });
      }
    }

    function displayInvisibleFromSameSet(thisObj){
      // display far-away linked segments under the last visible one in set

      hideFarAwaySegments(); // remove old ones

      var alignID = thisObj.attr('id');
      if (typeof alignID !== typeof undefined && alignID !== false) { // id exists

        $('body table.synopsis td:not([id="EB"])').each(function() { // do the same for all source texts

          for (var i = 0; i < $(this).find('p[id = ' + alignID + ']').length - 1; i++) {
            var segment1 = $(this).find('p[id = ' + alignID + ']:eq(' + i.toString() + ')')
            var isVisible1 = segment1.isInViewport();

            var segment2 = $(this).find('p[id = ' + alignID + ']:eq(' + (i + 1).toString() + ')')
            var isVisible2 = segment2.isInViewport();

            if ( isVisible1 && ! isVisible2 ) {
              addInvisibleSegmentsBelow($(this).index(), segment1, $(this).find('p[id = ' + alignID + ']:gt(' + i.toString() + ')'));
                // last visible (1), next invisible (2): add 2 (and all next) under 1.
              return;
            }

            if ( ! isVisible1 && isVisible2 ) {
              addInvisibleSegmentsAbove($(this).index(), segment2, $(this).find('p[id = ' + alignID + ']:lt(' + (i + 1).toString() + ')'));
                // last invisible (1), next visible (2): add 1 (and all previous) above 2.
              return;
            }
          }
        })
      }
    }

    function addInvisibleSegmentsBelow(columnIndex, thisObj, nextObj){
      // console.log("Must show invisible in same set");
      // console.log(columnIndex)

      thisObj.after("<small><table class='copyInvisible' width='100%'><tr><td width='20px'/><td></td></tr></table></small>")
      nextObj.each(function(){
		  var cloneObj = $(this).clone();

		  //create link from clone to original
		  var link = thisObj.attr('id') + "_" + (columnIndex + 1).toString() + "_" + ($(this).index() + 1).toString();
		  cloneObj.attr("distantLink_From", link);
		  cloneObj.removeAttr("distantLink_To"); // remove (avoid trailing attribute)
		  $(this).attr("distantLink_To", link);

		  thisObj.next("small").find("td:eq(1)").append(cloneObj);
      })
    }

    function addInvisibleSegmentsAbove(columnIndex, thisObj, prevObj){
      thisObj.before("<small><table class='copyInvisible' width='100%'><tr><td width='20px'/><td></td></tr></table></small>")
      prevObj.each(function(){
		var cloneObj = $(this).clone();

		//create link from clone to original
		var link = thisObj.attr('id') + "_" + (columnIndex + 1).toString() + "_" + ($(this).index() + 1).toString();
		cloneObj.attr("distantLink_From", link);
		cloneObj.removeAttr("distantLink_To"); // remove (avoid trailing attribute)
		$(this).attr("distantLink_To", link);

        thisObj.prev("small").find("td:eq(1)").append(cloneObj);
      })
	}

    function hideFarAwaySegments() {
      // hide far-away segments (undo displayInvisibleFromSameSet)
      $('.copyInvisible').parent().remove();
      $('.copyInvisible').remove();
    }

    function addToBasis(thisObj) {
      var oldIndexInSet;
      var setAlreadyInEB = false;
      var cSegmEB = 0;

      thisObj.find('> div > p').filter(function() {
         return ($(this).css('background-color') == selectedColor );
      }).attr("action", "yes");

      var cSegmSource = $('tr td p[action=yes]').length;

      var oldId = $('tr td p[action=yes]').first().attr('id');
  	  if (typeof oldId !== typeof undefined && oldId !== false) {
  		    $("tr td p[id='" + oldId + "'] ").removeClass("origin");
          setAlreadyInEB = $("#EB").find('[id=\"' + oldId + '\"]').length > 0
          cSegmEB = $("#EB").find('[id=\"' + oldId + '\"]').length;
      }

      thisObj.find('p[action=yes]').each(function(oldIndexInSet){
        $(this).removeAttr('action');
		    $(this).addClass("origin");
		    $(this).next().find('p').addClass("origin"); //also the small invisible ones
        var done = false

        // handle multiple para addition correctly: replace index by index (oldIndexInSet vs EBIndex)

        if ( setAlreadyInEB ) { // if id is already in Basis, replace it
          var newContent = $(this).html();

          $("#EB").find('[id=\"' + oldId + '\"]').each(function(EBIndex){
            if (EBIndex == oldIndexInSet) {
              done = true
              //console.log("match/replace: " + oldIndexInSet.toString() + " -> " + EBIndex.toString())

      			  var found = readUserChoices($(this));
      			  if ( found ) { noteTarget = $(this); var replace = true; saveUserChoices(replace); }
              $(this).replaceWith("<p id='" + oldId + "' contentEditable='true' >" + newContent + "</p>");

      			  if ( found ) { applyUserChoices(); }
              return false;
            }
          });

          if ( (! done) || ( oldIndexInSet == cSegmSource - 1 ) ) {
            if ( oldIndexInSet > cSegmEB - 1 ) { // all remaining in EB will be added at the end
              //console.log("add trailing source segments: " + oldIndexInSet.toString());
              $("#EB p[id='" + oldId + "']:last").next().after("<p id='" + oldId + "' contentEditable='true' >"
				+ newContent + "</p>");
            }
            else if ( oldIndexInSet < cSegmEB - 1 ) { // all remaining in EB will be removed
              $('tr td[id="EB"] p[id=\"' + oldId + '\"]').each(function(EBIndex){
                if ( EBIndex > oldIndexInSet ) {
                  $(this).next("table").remove();
                  $(this).remove();
                }
              })
            }
          }
        } // already in EB
        else { //new addition
          $("#EB").find('div').append("<p id='" + oldId + "' contentEditable='true'>" + $(this).html() + "</p>");
    		  var myDiv = $("#EB > div");
    		  myDiv.scrollTop(myDiv.prop("scrollHeight") - myDiv.height());
            }

          unselect()
      })
    }

    function removeSelectedFromBasis() {
      $("#EB p").filter(function() {
          return ($(this).css('background-color') == selectedColor );
      }).attr("action", "yes");
      $('tr td p[action=yes]').each(function(){
        // reset border for aligned segments
        var oldId = $(this).attr('id');
        if (typeof oldId !== typeof undefined && oldId !== false) { // id exists
          $("p[id='" + oldId + "']").css('border', 'none')
        }
        $(this).next("table").remove();
        $(this).remove();
      });
      unselect();
    };

    function align(thisObj) {
      $('tr td p').filter(function() {
         return ( $(this).css('background-color') == selectedColor );
      }).attr("action", "yes");

      var indexList = []
      $('tr td p[action=yes]').each(function() {
        if (! indexList.includes($(this).closest("td").index()) ) {
          indexList.push($(this).closest("td").index())
        }
      })

      // test if selection in at least two panes
     if (indexList.length >= 1) { // was: 2. 1 to allow non-aligned segments to be pushed to EB
        newId = Math.random().toString( 16 ).slice( 2, 10 )
        idList = []
        var existingID;

        $('tr td p[action=yes]').each(function() {
          $(this).removeAttr('action');
          // record all ids
          var existingID = $(this).attr('id');
          if (typeof existingID !== typeof undefined && existingID !== false) { // id exists
            idList.push(existingID)
          }

          // align selected (with new id)
          $(this).attr("id", newId);
          $(this).css('background-color', alignedColor);
          $(this).attr("contentEditable", 'false');
        })

        // also align previously aligned:
        // for all ids in recordset
        for (index = 0; index < idList.length; ++index) {
             // for all segments with the current id
             $('tr td p[id=' + idList[index] + ']').each(function() {
               // align (with new id)
               $(this).attr("id", newId);
               $(this).css('background-color', alignedColor)
               $(this).attr("contentEditable", 'false');
             })
         }

         // However, EB segments must always be editable
         $("td[id='EB'] p[id = '" + newId + "']").attr("contentEditable", 'true');

        unselect()
      }//test source-target (at least two panes)
    }

    function unalignSelected(thisObj) {
      thisObj.removeAttr('id');
      thisObj.css('background-color', 'inherit');
      thisObj.attr("contentEditable", 'true');
      var message = "Unaligned segment:\n" + thisObj.text();
      console.log(message);
      alert(message);
    };

    function unalign(thisObj) { //td
  		// var oldId, oldContent, oldBorder;
  		if (lastP) {
  			// oldId = lastP.attr('id');
  			// oldContent = lastP.text();
  			// oldBorder = lastP.css("border");
  			unalignSelected(lastP);
  		}

      /*
  		if (typeof oldId !== typeof undefined && oldId !== false) { // id exists
  			$("#EB").find("p[id=" + oldId + "]").each(function() {
  				if ( $(this).css("border") == oldBorder ) { // if from this column
  					if ( thisObj.find("p[id=" + oldId + "]").length == 0 ) { // none left
  						$("#EB").find("p[id=" + oldId + "]").each(function() {
  							if ( $(this).text() == oldContent ) { // same source
  								$(this).next("table").remove();
  								$(this).remove();
  							}
  						});
  					}
  					else { // some left
  						addToBasis(thisObj); // replace with current selection
  					}
  					return false; // exit each
  				}
  			});
        */

  			/*
  			// if last in set: unalign trailing singletons
  			if ( $("p[id=" + oldId + "]").length - $("#EB p[id=" + oldId + "]").length == 1) {// only one more left (- with the exception of Basis)
  				console.log("only one left; unalign");
  				$("p[id=" + oldId + "]").each(function() {
  					unalignSelected($(this))
  				})
  			} */
       //}
    } // unalign

    function isInteger(str) {
        return /^[1-9]\d*$/.test(str);
    }

    function isNumbering(str) {

        return /^[A-Z].+?\.[0-9]+\.[0-9]+$/.test(str.trim()) || /^([0-9]+(\.|\s)+)?[0-9]+(\.|\s)+\(?[0-9]+\)?$/.test(str.trim());
        // Letter, anything, dot, number, dot, number
        // or
        // number, dot or space, number (with or without parentheses; with/without preceding number+dot/space)

        // ([A-Z].+?\.[0-9]+\.)([0-9]+)

    }

    function addNumbering(thisObj){
        if ( isInteger(thisObj.text().trim().replace(/[\[\]()]/g,"")) ) { // ignore parentheses
            var crtNumber = thisObj.text().trim();
            var numberingStr = "???";
            // look for full numbering in previous p
            var fullNumberP = thisObj.prevAll('p').filter(function () {
                return isNumbering($(this).text());
            });
            if ( fullNumberP.length > 0 ) { numberingStr = fullNumberP.first().text().trim(); }
            // replace last occurrence of number with current number; separator: dot or space
            var cutPoint = numberingStr.lastIndexOf(".");
            if ( cutPoint < 0 ) { cutPoint = numberingStr.lastIndexOf(" "); }
            numberingStr = numberingStr.substring(0, cutPoint + 1) + crtNumber;
            // set as title
            thisObj.attr('title', numberingStr);
        }
    }

    $(document).on('mouseover', 'td[id!="EB"] .note-scope', function(e) { // On mouve over, show note
        var notes = [];
        var ownNote = $(this).find('span.note').first().text();
        if (ownNote) {notes.push(ownNote);}
        var EBNote = $('.synopsis td[id="EB"] p[id=' + $(this).attr('id') + ']').find('span.note').first().text();
        if (EBNote) {notes.push(EBNote);}
        $(this).attr('title', notes.join("\n"));
    });

    $(document).on('mouseover', '.synopsis tr td > div > p', function(e) { // add menu on the fly
        $(this).addClass("context-menu-one");
        addNumbering($(this));
    });

    $('.synopsis z').mousedown(function(event) {
        switch (event.which) {
            case 3:
                linkToFollow = $(this).attr('href')? CAL_URL + $(this).attr('href'): null;
                break;
            default:
        }
    });

    $(document).on('click', 'tr td[id!="EB"] > div > p', function(e) { // Shift + click: select

        if (e.shiftKey) {
          text_unselect();
          if (! isDoubleClicked($(this)) )  {
            // console.log("select on/off")
            selectSwitch($(this))
          }
        }
        else
          unselect();
          if (isAligned($(this))) {
            hideFarAwaySegments();
            //text_unselect();
            select($(this));
            selectSameSet($(this));
            displayInvisibleFromSameSet($(this));
            vAlignSameSet($(this));
            lastP = $(this);
          }
        e.preventDefault(); e.stopPropagation();
    });

    $(document).on('click', '.copyInvisible p', function(e) {
  		var myTag = $("p[distantLink_To='" + $(this).attr("distantLink_From") +"']");

  		var oldDelta = $(this).offset().top - $(this).closest('div').offset().top;
  		var newDelta = myTag.offset().top - myTag.closest('div').offset().top;

  		$(this).closest('div').scrollTop(
              $(this).closest('div').scrollTop() + newDelta - oldDelta
          )

          e.preventDefault(); e.stopPropagation();
    });

    $( "td[id!='EB']").keydown(function( e ) {
        // console.log(e.which);
        //disable editing of sources (except for ENTER)
        //unless content is specifically marked as editable ("@allowInsert = true")
          if (//( e.which !== 8 ) && // backspace
              ( e.which !== 13 ) && // enter
              //( e.which !== 32 ) && // space
              ( e.which !== 35 ) && // end
              ( e.which !== 36 ) && // home
              ( e.which !== 37 ) && // left arrow
              ( e.which !== 38 ) && // up arrow
              ( e.which !== 39 ) && // right arrow
              ( e.which !== 40 ) && // down arrow
              //( e.which !== 46 ) && // delete
              ( !(isUndoRedoCommand(e)) ) &&
              ( !(isCopyCommand(e)) ) &&
			        ( !(isSaveCommand(e)) ) &&
              ( !(isFindCommand(e)) )
              )
              {
                if (! allowsInsert($(this))) {
                  e.preventDefault();
                  e.stopPropagation();
                }
          }
    });

    function isUndoRedoCommand(e) {
      return ((e.metaKey || e.ctrlKey) &&
        ( ( String.fromCharCode(e.which).toLowerCase() === 'z') ||
          ( String.fromCharCode(e.which).toLowerCase() === 'y')
        )
      )
    }

    function isCopyCommand(e) {
      return ((e.metaKey || e.ctrlKey) &&
        ( ( String.fromCharCode(e.which).toLowerCase() === 'c')
        )
      )
    }

    function isFindCommand(e) {
      return ((e.metaKey || e.ctrlKey) &&
        ( ( String.fromCharCode(e.which).toLowerCase() === 'f')
        )
      )
    }

    function isSaveCommand(e) {
      return ((e.metaKey || e.ctrlKey) &&
        ( ( String.fromCharCode(e.which).toLowerCase() === 's')
        )
      )
    }

    function allowsInsert(thisObj) {
      var allowInsertAttr = thisObj.attr('allowInsert');
      if ( typeof allowInsertAttr == typeof undefined ) { return false; }
      if ( allowInsertAttr.toLowerCase() == "true" ) {
        return true;
      }
      else {
        return false;
      }
    }


    // BLOCK: EB ("Ecrit de base/ Base text") >> RIGHT-HAND SIDE

    $(document).on('keydown', '#EB', function(e) { // page up/down: move segment up, down in EB
      if ( (e.keyCode == 33) || (e.keyCode == 34) ) {
        e.preventDefault()
        e.stopPropagation()

        $('tr td[id="EB"] p').filter(function() {
           return ( $(this).css('background-color') == selectedColor );
        }).attr("action", "yes");

        if (e.keyCode == 33){ // move up (page up)
          $('tr td[id="EB"] p[action=yes]').each(function(indexInSet) {
            $(this).removeAttr('action');
            var i = $(this).index();
            if ( i > indexInSet) {
              var item = $(this);
              item.insertBefore(item.prev());
            }
          });
        }

        if (e.keyCode == 34){ // move down (page down)
          $('tr td[id="EB"] p[action=yes]').reverse().each(function(indexInSet) {
              $(this).removeAttr('action');
              var crtIndex = $(this).index();
              if ( crtIndex < $(this).parent().children().length - 1 - indexInSet ) {
                 var item = $(this);
                 item.insertAfter(item.next());
              }
          });
        }
      }
      else if ( (e.keyCode == 38) || (e.keyCode == 40) ) { // up, down arrow: go to next/previous segment
          $('tr td[id="EB"] p').filter(function() {
             return ( $(this).css('background-color') == selectedColor );
          }).attr("action", "yes");
          if (e.keyCode == 38) { // up arrow
              var firstSelected = $('tr td[id="EB"] p[action=yes]:first');
              if ( firstSelected ) { if ( firstSelected.prev() ) {firstSelected.prev().trigger('click')}}
          }
          if (e.keyCode == 40) { // down arrow
              var lastSelected = $('tr td[id="EB"] p[action=yes]:last');
              if ( lastSelected ) { if ( lastSelected.next() ) {lastSelected.next().trigger('click')}}
          }
          $('tr td[id="EB"] p[action=yes]').each(function() {
              $(this).removeAttr('action');
          });
      }
    });

    $(document).on('keyup', '.synopsis td[lang]', function(e) { //Main commands
      // console.log("keyup")
      e.preventDefault();

      if (e.keyCode == 27){ //Reset color (escape)
        hideFarAwaySegments();
        unselect();
      }

      if (e.keyCode == 16)   //shiftKey or metaKey: Trigger Align
        align($(this))

      showSegmentStat();
    });//keyup

    $(document).on('dblclick', 'tr td:not([id="EB"])', function (e) {
        text_unselect();
        if (! (e.shiftKey || e.metaKey ) )
          addToBasis($(this));
        else {
			unalign($(this));
		}
    });

    $(document).on('dblclick', 'tr td[id="EB"] > div > p', function (e) {
        e.preventDefault(); e.stopPropagation();
        removeSelectedFromBasis();
    });

    $(document).on('click', 'tr td[id="EB"] p', function(e) {//Select single
      unselect()
      select($(this))
      selectSameSet($(this))
      vAlignSameSet($(this))
    });

    // BLOCK: OTHER INTERFACE ITEMS

    // Text items on table footer
    function showSegmentStat(){
      var segments1 = $('table tr td:nth-child(1) p').length;
      var nbEmptyPara = 0
      $('table tr td:nth-child(1) p').each(function() {
        if ($(this).text()=="") {nbEmptyPara = nbEmptyPara + 1}
      })
      segments1 = segments1 - nbEmptyPara

      var segments2 = $('table tr td:nth-child(2) p').length;
      nbEmptyPara = 0
      $('table tr td:nth-child(2) p').each(function() {
        if ($(this).text()=="") {nbEmptyPara = nbEmptyPara + 1}
      })
      segments2 = segments2 - nbEmptyPara

      var segments3 = $('table tr td:nth-child(3) p').length;
      nbEmptyPara = 0
      $('table tr td:nth-child(3) p').each(function() {
        if ($(this).text()=="") {nbEmptyPara = nbEmptyPara + 1}
      })
      segments3 = segments3 - nbEmptyPara

      if (segments1 + segments2 + segments3 !== 0) {
        var alignedSegments1 = $('table tr td:nth-child(1) p[id]').length;
        var alignedSegments2 = $('table tr td:nth-child(2) p[id]').length;
        var alignedSegments3 = $('table tr td:nth-child(3) p[id]').length;

        if (alignedSegments1 + alignedSegments2 + alignedSegments3 !== 0) {

          $("#segcount1").html(alignedSegments1.toString() + '/' + segments1.toString());
          $("#segcount2").html(alignedSegments2.toString() + '/' + segments2.toString());
          $("#segcount3").html(alignedSegments3.toString() + '/' + segments3.toString());

          // if ((alignedSegments1 == segments1) ||
          //     (alignedSegments2 == segments2) ||
          //     (alignedSegments3 == segments3)) {
          //     stringA = stringA + " <b> (Ready) </b>"
          // }

        } else {
            $("#segcount1").html(segments1.toString());
            $("#segcount2").html(segments2.toString());
            $("#segcount3").html(segments3.toString());
        }

        // write Basis statistics
        if ( $("#EB p").length > 0 ) {
          var segmentsEB = $("#EB p").length;

          var nbEmptyPara = 0
          $("#EB p").each(function() {
            if ($(this).text()=="") {nbEmptyPara = nbEmptyPara + 1}
          })
          segmentsEB = segmentsEB - nbEmptyPara
          stringEB = segmentsEB.toString();

          var alignedSegmentsEB = $("#EB p[id]").length;
          if ( alignedSegmentsEB > 0 ) {
            stringEB = alignedSegmentsEB.toString() + '/' + stringEB;
          }

          $("#segcountEB").html(stringEB);
        }
      }
    }

    // Save button
    $(".save").click(function(){//Save HTML document, including alignment
      d = new Date()
      dateStr = d.getFullYear() + "-" +
        ("0" + (d.getMonth() + 1)).slice(-2) + "-" +
        ("0" + d.getDate()).slice(-2)
      $(this).attr("download", dateStr + ".htm")

      $(".save").each(function() { $(this).attr("href", "") }); //clear previous save content
      $(".export").each(function() { $(this).attr("href", ""); }); //clear previous export content
      var dateToShow = Date();
      dateToShow = dateToShow.substring(0, dateToShow.indexOf("(") - 1);
      $("#date").html(dateToShow);
      $('div[role="log"]').remove(); $('div[role="tooltip"]').remove(); // avoid spurious tooltip on Save - take 2
      $('.synopsis p[title]').removeAttr('title');

      contentToSave = "<html>" + $("html").html() + "</html>"
      href_text = "data:application/text;base64," + window.btoa(unescape(encodeURIComponent(contentToSave)));
      $(this).attr("href", href_text)
    })

    // LHS colums browse on key up/down
    $('tr td[id!="EB"] > div > p[id]').attr("tabindex", 1); // Force event binding
    $(document).on('keydown', 'tr td[id!="EB"] > div > p', function(e) {
      if ( (e.keyCode == 38) || (e.keyCode == 40) ) { // up, down arrow: go to next/previous aligned segment
          if (e.keyCode == 40) {
            var p = $(this).nextAll('p[id]:first');
          } else
            var p = $(this).prevAll('p[id]:first');
          if ( p) { p.focus(); p.trigger('click'); }
          e.stopPropagation();
          e.preventDefault();
      }
    });

    $(document).on('keydown', function(e) {
      if ( isSaveCommand(e) ) {
        $('.save').first().trigger("click");
      }
    });

    // Export button
    $(".export").click(function(){//Export synopsis in HTML format
        var langStr = "the last column";
        var langSuffix = "";
        if ( ! isNaN(referenceExport)  && referenceExport < $('.synopsis td[lang]').length ) {
            langStr = $('.synopsis td[lang]:eq(' + referenceExport + ')').attr('lang');
            langStr = langStr[0].toUpperCase() + langStr.slice(1); // capitalise
            langSuffix = "-" + langStr;
        }
        if ( ! confirm("Data will be exported using " + langStr + " as reference (the segments in the other texts will be reordered accordingly).") ) {return;}
        d = new Date()
        dateStr = d.getFullYear() + "-" +
          ("0" + (d.getMonth() + 1)).slice(-2) + "-" +
          ("0" + d.getDate()).slice(-2)
        $(this).attr("download", dateStr + "-export" + langSuffix + ".htm");
        $(".export").each(function() { $(this).attr("href", ""); $(this).attr("target", "_blank"); }); //clear previous export content
        contentToSave = "<html>\n\t<head>\n\t\t<meta http-equiv='content-type' content='text/html; charset=UTF-8'>" +
                        "\n\t\t<style>" +
                        "\n\t\t\ttable {border-collapse: collapse; border-color:lightgray;}" +
                        "\n\t\t\ttd {border-style:solid; padding: 3px; vertical-align:top;}" +
                        "\n\t\t\t.unaligned {font-size:smaller;}" +
                        "\n\t\t\t.unaligned td {border-style:none;}" +
                        "\n\t\t\t.idx {font-size:smaller; color:lightgray;}" +
                        "\n\t\t\t.note {direction: ltr; font-size:small; display:block; text-align:left; font-family: Arial, Helvetica, sans-serif;}" +
                        "\n\t\t\t.note:before {content: 'Note:\\a'; font-weight: bold; white-space: pre;}" +
                        "\n\t\t</style>" +
                        "\n\t\t<title>IRSB Synopsis Export</title>\n\t</head>\n\t<body>";
        // contentToSave += htmlExportSynopsis();
        contentToSave += htmlExportAlignments(referenceExport, langStr);
        contentToSave += "\n\t</body>\n</html>";
        href_text = "data:application/text;base64," + window.btoa(unescape(encodeURIComponent(contentToSave)));
        $(this).attr("href", href_text);
    });

    function htmlExportSynopsis(){
      var mystring = "";
      mystring += "\n\t<h3>IRSB Synopsis Export</h3>";
      mystring += "\n\t<p>" + $('#EB p[id]').length.toString() + " segments</p>";
      mystring += "\n\t<p>Indexes in square brackets correspond to the segments order in the original texts.";
      mystring += "</p>";

      mystring += "\n\t<table border='1' style='border-style:dashed'>";
      var oldsegmentid = null;
      var lastAddedIndexes = []; // keep old position i.o.t. collect unaligned segments
      for ( let i=0; i < $('.synopsis td[lang]').length; i++ ) { lastAddedIndexes[i] = -1; }
      var newlyAddedIndexes = [];
      $('#EB p[id]').each(function (index) { // for each segment in synopsis (last column)
          crtrowstring = "\n\t\t<tr>";
          var segment = $ (this);
          var segmentid = $ (this).attr('id');

          $('.synopsis td:not([id="EB"]').each(function (tdindex){ // for each text
              var mylang = $(this).attr('lang');
              var mydir = $(this).find('div').attr('dir');
              var mycolumnid = $(this).attr('id');
              var myfont = $(this).css('font-family');
              var mysize = $(this).css('font-size');
              crtrowstring += "\n\t\t\t<td";
              if ( mydir ) { crtrowstring += " dir='" + mydir + "' style='font-family: " + myfont + "; font-size:" + mysize + " '"; }
              crtrowstring += ">";
              $(this).find('p[id = ' + segmentid + ']').each(function (eqindex){ // for each equivalent segments
                  // equivalent segments found
                  if ( eqindex >= 1 ) { crtrowstring += "<br/>"; } // add newline in-between segments
                  var myindex = null;
                  if ( mylang ) {
                      myindex = $('.synopsis td[lang=' + mylang + '] p[id = ' + segmentid +']:eq(' + eqindex + ')').index();
                      newlyAddedIndexes[tdindex] = myindex;
                  } else {
                      myindex = $('.synopsis #EB p[id = ' + segmentid +']:eq(' + eqindex + ')').index();
                  }
                  // format index
                  var myindexstr = "<span class='idx'>" + "[" + (myindex + 1).toString() + "] " + "</span>";
                  crtrowstring += myindexstr;
                  crtrowstring += $(this).text(); // collect text
              });
              crtrowstring += "</td>";
          });
          crtrowstring += "\n\t\t</tr>";
          if ( ! ((oldsegmentid) && (oldsegmentid == segmentid)) ) { // only add if not same segment id

              // collect previous unaligned segments and add as special row
              if ( skippedExist(lastAddedIndexes, newlyAddedIndexes) ) {
                  var toCollectExist = false; // maybe skipped segments exist, but there is no unaligned segment to add (all are already aligned)
                  var unalignedrowstring = "\n\t\t<tr class='unaligned'>";
                  // collect everything unaligned from each column, from last to new index
                  $('.synopsis td[lang]').each(function (tdindex){
                      var mydir = $(this).find('div').attr('dir');
                      var myfont = $(this).css('font-family');
                      var mysize = $(this).css('font-size');
                      var afterfirst = false;
                      unalignedrowstring += "\n\t\t\t<td";
                      if ( mydir ) { unalignedrowstring += " dir='" + mydir + "' style='font-family: " + myfont + "; font-size:" + mysize + " '"; }
                      unalignedrowstring += ">";
                      for ( let pindex = lastAddedIndexes[tdindex] + 1; pindex < newlyAddedIndexes[tdindex] ; pindex++ ) {
                        var unalignedSegment = $('.synopsis td[lang]:eq(' + tdindex + ') p:eq(' + pindex + ')');
                        if ( ! unalignedSegment.attr('id') ) { // we add it only if not aligned
                            toCollectExist = true;
                            var thissegmentstring =  afterfirst ? "<br/>" : "";
                            thissegmentstring += "<span class='idx'>" + "[" + (unalignedSegment.index() + 1).toString() + "] " + "</span>";
                            thissegmentstring += unalignedSegment.text();
                            unalignedrowstring += thissegmentstring;
                            afterfirst = true;
                        }
                      }
                      unalignedrowstring += "</td>";
                  });
                  unalignedrowstring += "\n\t\t\t<td/>"; // empty last cell
                  unalignedrowstring += "\n\t\t</tr>";
                  if ( toCollectExist ) { mystring += unalignedrowstring; }
              }

              mystring += crtrowstring;
          }
          oldsegmentid = segmentid;
          // simulate lastAddedIndexes = newlyAddedIndexes;
          //console.log(newlyAddedIndexes.toString());
          for ( let i=0; i < $('.synopsis td[lang]').length; i++ ) { lastAddedIndexes[i] = newlyAddedIndexes[i]; }
      });
      mystring += "\n\t</table>";
      return mystring;
    }

    function htmlExportAlignments(refColumn, languageStr){ // Only export a text if shown on screen (column not hidden).
      var mystring = "";
      mystring += "\n\t<h3>ENLAC Synopsis &ndash; Alignment Export (" + languageStr + ")</h3>";
      mystring += "\n\t<p>" + $('.synopsis td:eq(' + refColumn + ') p[id]').length.toString() + " aligned segments</p>";
      var alignedSegmentIDs = [];
      $('.synopsis td:eq(' + refColumn + ') p[id]').each(function(){ alignedSegmentIDs.push(this.id); });
      mystring += "\n\t<p>Indexes in square brackets correspond to the segments order in the original texts.";
      mystring += "</p>";

      mystring += "\n\t<table border='1' style='border-style:dashed'>";
      var lastAddedIndexes = []; // keep old position i.o.t. collect unaligned segments
      for ( let i=0; i < $('.synopsis td[lang]:visible').length; i++ ) { lastAddedIndexes[i] = -1; }
      var newlyAddedIndexes = [];
      var collectedIDs = []; $('.synopsis td[lang]:visible').each(function (i){ collectedIDs[i] = []; });
      var seenAlignedSegmentIDs = [];
      $('.synopsis td:eq(' + refColumn + ') p[id]').each(function (index) { // for each segment in reference column
          crtrowstring = "\n\t\t<tr>";
          var segment = $ (this);
          var segmentid = $ (this).attr('id');

          $('.synopsis td[lang]:visible').each(function (tdindex){ // for each text shown on screen (column not hidden)
              var mylang = $(this).attr('lang');
              var mydir = $(this).find('div').attr('dir');
              var mycolumnid = $(this).attr('id');
              var myfont = $(this).css('font-family');
              var mysize = $(this).css('font-size');
              crtrowstring += "\n\t\t\t<td";
              if ( mydir ) { crtrowstring += " dir='" + mydir + "' style='font-family: " + myfont + "; font-size:" + mysize + " '"; }
              crtrowstring += ">";
              $(this).find('p[id = ' + segmentid + ']').each(function (eqindex){ // for each equivalent segments
                  // equivalent segments found
                  if ( eqindex >= 1 ) { crtrowstring += "<br/>"; } // add newline in-between segments
                  var myindex = null;
                  if ( mylang ) {
                      myindex = $('.synopsis td[lang=' + mylang + '] p[id = ' + segmentid +']:eq(' + eqindex + ')').index();
                      newlyAddedIndexes[tdindex] = myindex;
                  } else {
                      myindex = $('.synopsis #EB p[id = ' + segmentid +']:eq(' + eqindex + ')').index();
                  }
                  // format index
                  var myindexstr = "<span class='idx'>" + "[" + (myindex + 1).toString() + "] " + "</span>";
                  crtrowstring += myindexstr;
                  var cloneSegment = $(this).clone(); cloneSegment.children('.note').removeAttr('style'); // remove default style (display:none)
                  crtrowstring += cloneSegment.html(); // collect text (with markup)
              });
              crtrowstring += "</td>";
          });
          crtrowstring += "\n\t\t</tr>";
          if ( ! seenAlignedSegmentIDs.includes(segmentid) ) { // only add if not same segment id

              // collect previous unaligned segments and add as special row
              if ( skippedExist(lastAddedIndexes, newlyAddedIndexes) ) {
                  var toCollectExist = false; // maybe skipped segments exist, but there is no unaligned segment to add (all are already aligned)
                  var unalignedrowstring = "\n\t\t<tr class='unaligned'>";
                  // collect everything unaligned from each column, from last to new index
                  $('.synopsis td[lang]:visible').each(function (tdindex){
                      var mydir = $(this).find('div').attr('dir');
                      var myfont = $(this).css('font-family');
                      var mysize = $(this).css('font-size');
                      var afterfirst = false;
                      unalignedrowstring += "\n\t\t\t<td";
                      if ( mydir ) { unalignedrowstring += " dir='" + mydir + "' style='font-family: " + myfont + "; font-size:" + mysize + " '"; }
                      unalignedrowstring += ">";
                      for ( let pindex = lastAddedIndexes[tdindex] + 1; pindex < newlyAddedIndexes[tdindex] ; pindex++ ) {
                        var unalignedSegment = $('.synopsis td[lang]:eq(' + tdindex + ') p:eq(' + pindex + ')');
                        if ( ! unalignedSegment.attr('id') || ! alignedSegmentIDs.includes(unalignedSegment.attr('id')) ) { // we add it only if not aligned (with current language)
                            if ( ! collectedIDs[tdindex].includes(pindex) ) { // only add it once
                                toCollectExist = true;
                                collectedIDs[tdindex].push(pindex);
                                var thissegmentstring =  afterfirst ? "<br/>" : "";
                                thissegmentstring += "<span class='idx'>" + "[" + (unalignedSegment.index() + 1).toString() + "] " + "</span>";
                                var cloneSegment = unalignedSegment.clone(); cloneSegment.children('.note').removeAttr('style'); // remove default style (display:none)
                                thissegmentstring += cloneSegment.html(); // collect text (with markup)
                                unalignedrowstring += thissegmentstring;
                                afterfirst = true;
                            }
                        }
                      }
                      unalignedrowstring += "</td>";
                  });
                  unalignedrowstring += "\n\t\t\t<td/>"; // empty last cell
                  unalignedrowstring += "\n\t\t</tr>";
                  if ( toCollectExist ) { mystring += unalignedrowstring; }
              }

              mystring += crtrowstring;
          }
          seenAlignedSegmentIDs.push(segmentid);
          // simulate lastAddedIndexes = newlyAddedIndexes;
          //console.log(newlyAddedIndexes.toString());
          for ( let i=0; i < $('.synopsis td[lang]:visible').length; i++ ) { lastAddedIndexes[i] = newlyAddedIndexes[i]; }
      });
      mystring += "\n\t</table>";
      return mystring;
    }


    function skippedExist(array1, array2) { // returns true if not all values are consecutive in array1 vs array2
        var skippedArray = [];
        for (let i=0; i<array1.length; i++) { skippedArray[i] = (Math.abs(array1[i] - array2[i]) > 1); }
        return ( skippedArray.includes(true) );  // segments in-between
    }

    // if ( mycolumnid == 'EB') {
    //     $('#EB p[id = ' + segmentid']').each(function (synindex){
    //         // all in synopsis with the same id; put into the same cell
    //     });
    // }
    showSegmentStat()

  	window.onbeforeunload = function() {
  		return confirm("Do you really want to close?");
  	};

    // Right-click menu option: Perseus definition (e.g., https://www.perseus.tufts.edu/hopper/morph?l=κυρίῳ)
    $(function() {
        $.contextMenu({
            selector: '.context-menu-one',
            items: {
                "perseus_greek": {name: "PERSEUS (Greek)", icon:"fa-book", callback: function(key, opt){
                  var word = getSelectionText();
                  if ( word != '' ) {
                      window.open("https://www.perseus.tufts.edu/hopper/morph?l=" + word + "&la=greek", "_blank");
                  }
                  else {
                    alert("Please select a word first.")
                  }
                }},
				        "perseus_latin": {name: "PERSEUS (Latin)", icon:"fa-book", callback: function(key, opt){
                  var word = getSelectionText()
                  if ( word != '' ) {
                      window.open("https://www.perseus.tufts.edu/hopper/morph?l=" + word + "&la=la", "_blank");
                  }
                  else {
                    alert("Please select a word first.")
                  }
                }},
/* 				"syriac": {name: "Sureth (Syriac)", icon: "edit", callback: function(key, opt){
                  var word = getSelectionText()
                  if ( word != '' ) {
						post(	"http://www.assyrianlanguages.org/sureth/dosearch.php",
							'{"language":"syriac", "syriackey":"' + word + '"}');
                  }
                  else {
                    alert("Please select text first.")
                  }
                }},	 */

         				"syriac": {name: "CAL (Syriac)", icon: "fa-book", callback: function(key, opt){
                    if ( linkToFollow ) {
                        window.open(linkToFollow, "_blank");
                        linkToFollow = null;
                    }
                }},

                "sep0": "---------",

                "segment-unalign": {name: "Unalign segment", icon: "fa-unlink", callback: function(key, opt){
                    unalignSelected($(this));
                }},

                "segment-above": {name: "Insert segment above", icon: "fa-arrow-up", callback: function(key, opt){
                    $("<p>&nbsp;</p>").insertBefore($(this));
                }},

                "segment-below": {name: "Insert segment below", icon: "fa-arrow-down", callback: function(key, opt){
                    $("<p>&nbsp;</p>").insertAfter($(this));
                }},

                "remove": {name: "Remove segment", icon: "fa-cut", callback: function(key, opt){
                    if (($(this).text().length == 0)  ||  confirm("The following segment will be deleted:" + "\n\n\"" + $(this).text() + "\"")) {
                        $(this).remove();
                    }
                }},

                "edit": {name: "Change text", icon:"fa-unlock", callback: function(key, opt){
                    $(this).closest('td').css('background-color', insertModeColor);
                    $(this).closest('td').attr('allowInsert', "true");
                }},

                "lock": {name: "Lock text", icon:"fa-lock", callback: function(key, opt){
                    $(this).closest('td').css('background-color', "");
                    $(this).closest('td').attr('allowInsert', "false");
                }},

                "highlight": {name: "Highlight / Remove highlighting", icon:"fa-paint-brush", callback: function(key, opt){
                    var word = getSelectionText();
                    if ( word != '' ) {
                        var selected = getSelection();
                        var range = selected.getRangeAt(0);
                        var parent = range.endContainer.parentElement;
                        if ( parent.classList.contains("highlighted") ) {
                            parent.replaceWith(parent.innerHTML);
                        }
                        else if(selected.toString().length > 1){
                            var newNode = document.createElement("span");
                            newNode.setAttribute("class", "highlighted");
                            try { range.surroundContents(newNode) } catch { alert("Make sure the selection is within the word boundaries."); } ;
                        }
                        selected.removeAllRanges();
                    }
                    else {
                      alert("Please select a word first.")
                    }
                }},

                // attach note directly to segment
                "note": {name: "Note...", icon:"fa-edit", callback: function(key, opt){
                    adaptModalLanguages($('.synopsis td[lang]'));
                    autoSelectLanguage($(this).closest('td[lang]'));
                    resetBorders = false;
                    var found = readUserChoices($(this));
                    if ( $(this).closest('td[id="EB"]').length ) {
                        $('#myModalSaveNewBtn').hide();
                        $('#myModalSaveOverBtn').text("Save");
                    } else {
                        $('#myModalSaveNewBtn').show();
                        $('#myModalSaveOverBtn').text("Overwrite");
                    }
                    $('#myModal').modal({backdrop: 'static', keyboard: false}); // prevent closing
                    noteTarget = $(this);
                }},

                // delete note
                "delete-note": {name: "Delete note", icon:"fa-eraser", callback: function(key, opt){
                    if ( $(this).closest('td#EB').length ) {
                        noteTarget = $(this);
                        deleteNote();
                    }
                    if ( $(this).hasClass('note-scope') ) {
                        if ( $(this).children('span.note').length ) {
                            if ( confirm("The following note will be deleted:" + "\n\n\"" + $(this).children('span.note').first().text() + "\"") ) {
                                $('#noteConcernedLanguages input').each(function () { $(this).prop("checked", false); });
                                $(this).children('span.note').remove();
                                $(this).css('border-bottom', '');
                                $(this).removeClass('note-scope');
                                $(this).removeAttr('title');
                            }
                        }
                        else {
                            alert("This segment has no note itself. Delete note from the last column.");
                        }
                    }
                }},

                // "notes": {name: "Show notes", callback: function(key, opt){
                //     $(this).closest('td[lang]').find('.note').show();
                // }},

                "sep1": "---------",

                "inprogress": {name: "False parallels", icon:"fa-spinner", callback: function(key, opt){
                    $(this).toggleClass("wip");
                }},

                "sep2": "---------",

                "hide": {name: "Hide column", icon:"fa-eye-slash", callback: function(key, opt){
                    // at least two columns left
                    if ( $('.synopsis td:visible').length >= 2 )  {
                        $(this).closest('td').hide();
                    }
                }},

                "show": {name: "Show all columns", icon:"fa-eye", callback: function(key, opt){
                    $('.synopsis td').show();
                }},

                "mark": {name: "Reference column for export", icon:"fa-check-circle-o", callback: function(key, opt){
                    referenceExport = $(this).closest('td').index();
                    langStr = $(this).closest('td').attr('lang');
                    if ( langStr ) {
                        langStr = langStr[0].toUpperCase() + langStr.slice(1); // capitalise
                    }
                    alert("Data will be exported using " + langStr + " as reference (the segments in the other texts will be reordered accordingly).");
                }},
            },
        });
    });

  function getSelectionText() {
      var text = "";
      if (window.getSelection) {
          text = window.getSelection().toString();
      } else if (document.selection && document.selection.type != "Control") {
          text = document.selection.createRange().text;
      }
      return text;
  }

  function getSelection() {
      var seltxt = '';
       if (window.getSelection) {
           seltxt = window.getSelection();
       } else if (document.getSelection) {
           seltxt = document.getSelection();
       } else if (document.selection) {
           seltxt = document.selection.createRange().text;
       }
      else return;
      return seltxt;
  }

	// Post to the provided URL with the specified parameters.
	// Source: https://stackoverflow.com/questions/133925/javascript-post-request-like-a-form-submit
	function post(path, parameters) {
		var form = $('<form></form>');

		form.attr("method", "post");
		form.attr("action", path);
		form.attr("target", "_blank"); // VS

		parameters = JSON.parse(parameters); // VS: avoid error "right-hand side of 'in' should be an object got string"
		$.each(parameters, function(key, value) {
			var field = $('<input></input>');

			field.attr("type", "hidden");
			field.attr("name", key);
			field.attr("value", value);

			form.append(field);
		});

		// The form needs to be a part of the document in
		// order for us to be able to submit it.
		$(document.body).append(form);
		form.submit();
		$("body").children("form").last().remove(); //VS remove (effemeral) form
	}

  function CAL_Code(str){
      var mapObj = {};
      mapObj['ܐ'] = ")";
      mapObj['ܒ'] = "b";
      mapObj['ܓ'] = "g";
      mapObj['ܕ'] = "d";
      mapObj['ܗ'] = "h";
      mapObj['ܘ'] = "w";
      mapObj['ܙ'] = "z";
      mapObj['ܚ'] = "x";
      mapObj['ܛ'] = "T";
      mapObj['ܝ'] = "y";
      mapObj['ܟ'] = "k";
      mapObj['ܠ'] = "l";
      mapObj['ܡ'] = "m";
      mapObj['ܢ'] = "n";
      mapObj['ܣ'] = "s";
      mapObj['ܥ'] = "(";
      mapObj['ܦ'] = "p";
      mapObj['ܧ'] = "P";
      mapObj['ܨ'] = "c";
      mapObj['ܩ'] = "q";
      mapObj['ܪ'] = "r";
      mapObj['ܫ'] = "$";
      mapObj[' '] = "&";
      mapObj['ܬ'] = "t";

      var re = new RegExp(Object.keys(mapObj).join("|"),"gi");
      str = str.replace(re, function(matched){
        return mapObj[matched];
      });
      return str;
  }

	// BLOCK: NOTES MODAL

	$('#myModal').on('shown.bs.modal', function () {
	  $('#textareaID').trigger('focus')
	})

  $('#myModalSaveOverBtn').click(function(){
    var replace = true;
    saveUserChoices(replace);
    resetBorders = false;
    applyUserChoices(resetBorders);
    $(this).closest('.ui-dialog-content').dialog('close');  // close modal
	})

  $('#myModalSaveNewBtn').click(function(){
    var replace = false;
    saveUserChoices(replace);
    resetBorders = false;
    applyUserChoices(resetBorders);
    $(this).closest('.ui-dialog-content').dialog('close');  // close modal
	})

	$('#myModal').on('hidden.bs.modal', function () { // on Close: save user choices & reset fields
		$('#textareaID').empty();
		$('#noteConcernedLanguages input').each(function (i) { $(this).prop("checked", false); });
    // $('#noteConcernedLanguages input').each(function (i) { $(this).prop("disabled", false); });
	})

	$('#noteConcernedLanguages label').on('click', function(e) { // allow label to behave like checkbox
		var checkBox = $(this).prev('input[type=checkbox]');
        checkBox.trigger('click');
	});

	function adaptModalLanguages(selectionObj) {
    $('#noteConcernedLanguages div').show();
		var existing = selectionObj.map(function() {return this.lang.toLowerCase(); }).get().join();
		for ( l in languages ) {
			if ( ! existing.split(',').includes(languages[l].toLowerCase()) ) {
				$('#noteConcernedLanguages input[id=' + languages[l].toLowerCase() + ']').each(function () {
					$(this).closest('div').hide();
				});
			}
		}
	}

  function autoSelectLanguage(selectionObj) {
      if ( selectionObj && selectionObj.attr('lang')) {
          $('#noteConcernedLanguages input[id=' + selectionObj.attr('lang').toLowerCase() + ']').prop( "checked", true );
      }
  }

  function insertColorPalette(){
    $('#noteConcernedLanguages input').each(function () {
      if ( $(this).closest('div').children('select').length == 0 ) {
          $(this).closest('div').append('<select style="width:80px;"/>');
          var colorlist = $(this).closest('div').find('select');
          for ( i in borderBottomCategories ) {
            colorlist.append('<option value="' + i.toString() +
                '" onclick="parentElement.style.backgroundColor = borderBottomCategories[this.value];" ' +
                ' style="background-color:' + borderBottomCategories[i] +
                '"></option>');
          }
        }
    });
  }

	function readUserChoices(thisObj){

    // reset colors
    $('#noteConcernedLanguages input ~ select').each(function (i) {
      $(this).css("background-color", "white");
      $(this).children('option').prop("selected", false);
    });

		var mySpanElements = thisObj.find('span.note'); // look in the current element; direct note

    if ( ! mySpanElements.length ) {
    		// look in whole set
    	  var oldId = thisObj.attr('id');
    		if (typeof oldId !== typeof undefined && oldId !== false) { // id exists
    			   mySpanElements = $("#EB p[id=" + oldId + "] span.note"); // here is where the note and user options lie
    		}
    }

    if ( mySpanElements.length ) {
			var mySpan = mySpanElements.first();
      var appliestoArray = mySpan.attr('appliesTo') ? mySpan.attr('appliesTo').split(',') : [];
      var colorArray = mySpan.attr('colors') ? mySpan.attr('colors').split(',') : [];
			$('#textareaID').html(mySpan.html()); // set note
			$('#noteConcernedLanguages input').each(function (i) {
				$(this).prop("checked", false); // reset first
        // $(this).prop( "disabled", false );
        var crtLang = $(this).attr("id");
				if ( appliestoArray.includes(crtLang) ) {
					$(this).prop("checked", true);
          // if ( $('.synopsis tr td[lang=' + crtLang + '] p[id=' + thisObj.attr('id') + ']').first().hasClass('note-scope') ) {
          //     $(this).prop( "disabled", true );
          //     console.log("disabled: " + crtLang + " because of " + '.synopsis tr td[lang=' + crtLang + '] p[id=' + thisObj.attr('id') + ']');
          // } // can't be excluded because note exists (must be deleted first)
          var index = appliestoArray.indexOf(crtLang);
          if ( colorArray.length > index ) {
              $('#noteConcernedLanguages input[id = ' + crtLang + '] ~ select').val(colorArray[index]).css("background-color", borderBottomCategories[colorArray[index]]);
          }
				}
			});

			return true;
		}
		return false;
	}

	function saveUserChoices(replace){
		if ( ( $('#textareaID').text().trim().length > 0 ) && noteTarget ) {
			var appliesToStr = $( "#myModal #noteConcernedLanguages input:checked" ).map(function() {return this.id; }).get().join();
      var colorsStr = $( "#myModal #noteConcernedLanguages input:checked ~ select" ).map(function() {return $( this ).val(); }).get().join();
			var toSaveStr = '<span class="note" style="display:none" ' + 'appliesTo="' + appliesToStr + '" ' + 'colors="' + colorsStr + '">' +
				$('#textareaID').html() + '</span>'

      if ( noteTarget.closest('td#EB').length ) {
          storeNote(noteTarget, toSaveStr, replace);
          return;
      }

      // if note not on EB column: store to each concerned language
      if ( noteTarget.closest('td[lang]').length ) {
          // LHS column

          // a warning about possible loss of existing notes
          if ( replace && $( "#myModal #noteConcernedLanguages input:checked" ).length > 1 ) {
              if ( ! confirm("Do you really want to overwrite ? Previous notes will be deleted.") ) {
                  return;
              }
          }

          $( "#myModal #noteConcernedLanguages input:checked" ).each(function (){
              if ( noteTarget.attr("id") ) {
                  // note applies to aligned segments: store in all affected segments
                  $('.synopsis tr td[lang=' + $(this).attr("id") + '] p[id=' + noteTarget.attr("id") + ']').each(function() {
                      storeNote($(this), toSaveStr, replace);
                  });
              }
              else { // unaligned segment
                  storeNote(noteTarget, toSaveStr, replace);
              }
          });
      }
		}
	}

  function storeNote(thisObj, note, replace) {
      if (! thisObj.children("span.note").length) {
          thisObj.append(note);
      }
      else {
          if ( replace ) { thisObj.children('span.note').first().replaceWith(note); }
          else {
              // append
              var existingNote = thisObj.children('span.note').first().text();
              thisObj.children('span.note').first().replaceWith(note);
              thisObj.children('span.note').first().text(thisObj.children('span.note').first().text() + "\n" + existingNote);
          }
      }
  }

	function applyUserChoices(resetBorders){
		if ( noteTarget ) {

      if ( resetBorders ) {
          noteTarget.css('border-bottom', '');
          noteTarget.removeClass('note-scope');
          noteTarget.removeAttr('title');
    			// and all segments in set
    			$('.synopsis tr td:not([id="EB"]) p[id=' + noteTarget.attr("id") + ']').each(function() {
    				$(this).css('border-bottom', '');
            $(this).removeClass('note-scope');
            $(this).removeAttr('title');
    			});
      }

			if ( readUserChoices(noteTarget) ){
				$( "#myModal #noteConcernedLanguages input:checked" ).each(function (){ // for each language
          var mycolor = $(this).closest('div').find('select').val();
    			// all segments in set
					$(".synopsis td[lang= " + $(this).attr('id') + "] p[id=" + noteTarget.attr('id') + "]").each(function (){ // for each segment in vertical alignment
            $(this).addClass('note-scope');
            $(this).css('border-bottom', "thick solid " + borderBottomCategories[mycolor]);
					});
          if (! noteTarget.attr('id') ) { // also for unaligned
              noteTarget.addClass('note-scope');
              noteTarget.css('border-bottom', "thick solid " + borderBottomCategories[mycolor]);
          }
				});
			}
		}
	}

  function deleteNote(){
    $('#textareaID').empty();
    $('#noteConcernedLanguages input').each(function (i) { $(this).prop("checked", false); });
		if ( noteTarget ) {
        if ( noteTarget.children('span.note').length &&
            confirm("The following note will be deleted:" + "\n\n\"" + noteTarget.children('span.note').first().text() + "\"") ) {
            noteTarget.children('span.note').remove();
            resetBorders = true;
            applyUserChoices(resetBorders);
            //re-apply for the set
            var oldId = noteTarget.attr('id');
            $(".synopsis p[id=" + oldId + "]").each(function (){ // for each segment in alignment
                // read and apply
                if ( $(this).children('span.note').length ) {
                    noteTarget = $(this);
                    resetBorders = false;
                    applyUserChoices(resetBorders);
                }
            });
            noteTarget = null;
        }
    }
  }

});//Ready
