/*
  * Functions for manipulating the JSON data returned from a call
  * to the ONS API and outputting the results as an expandable tree.
  * The data used is the areas.
  * The tree is initialised with a call to the ONS API that
  * retrieves the top level area 'England and Wales'.
  * The areas relate to specific hierarchies, eg, 2011WARDH
  * or 2011PARLH, so a hierarchy needs to be supplied in the URI
  * Also, different hierarchies are available for different datasets,
  * so a dataset id also needs to be supplied in the URI.
  * Here we have arbitrarily picked a dataset id and corresponding
  * hierarchy id. 
  * Pick a hierarchy and then hit the 'Initialise Area Tree' button
  * to initialise the tree with the top level area.
  * When an area node is expanded for a particular area, that
  * area's sub-areas are retrieved and displayed as children
  * of the parent area. Once retrieved they do not need to be
  * re-retrieved via the ONS API if a node (area) is closed and
  * then re-opened again.
  *
  * This works in both IE and Firefox and uses the JQuery and JSTree
  * javascript library plug-ins, which are free open source libraries.
  *
  * URL format for top level areas
  * http://data.ons.gov.uk/ons/api/data/hierarchy/QS611EW.json?context=Census&apikey=12345&geog=2011WARDH&parent=&levels=0
  *
  * URL format for getting sub-areas of a parent area
  * http://data.ons.gov.uk/ons/api/data/hierarchy/QS611EW/parent/PARENT_AREA_CODE_GOES_HERE.json?context=Census&apikey=12345&geog=2011WARDH
  *
  * Author: Neil Sillitoe for Office for National Statistics
  */


// ########    TOGGLE BETWEEN API OR PRE-LOADED JSON RESPONSE     ###########
// #                                                                        #
// #      Allows tree to be populated without using the API/Internet.       #
// #      JSON data pre-stored within the javascript                        #
// ##     set to false to use pre-stored JSON response                      #
var USE_API = true;                                                     //  #
// #                                                                        #
// ##########################################################################

var endpoint ="http://data.ons.gov.uk/ons/api/data/hierarchy/";

// Context (census, economic, etc)
var context = "?context=Census";
var apiKey = "&apikey=0YOH4UDkTJ";

// Geographical Hierarchy
var hierarchy = "&geog=";

// Get top level areas to initially populate area tree with
//var filterTopLevelAreas = "&parent=&levels=0"; //top level

var filterTopLevelAreas = "&parent=&levels="; //top level
var filterTopLevelAreaNum = 2;

// Get areas under a specific parent area
var filterSubAreas = "/parent/";

var formatXML = ".xml";
var formatJSON = ".json";

var jsonObject;
var jsonAreaData = "";
var obj;

var highestLevelNumber = 0;
var gotMaxLevelNumber = false;
// English or Welsh - set on web page
var language = '0';
var curHierarchy = "2011WARDH";
/**
   * When document loaded, set a handler on the click event
   * for the 'go' button. When clicked, display the 'twirly'
   * in the area tree box, to show something processing is
   * occurring, call the resetPage function and then
   * the getAreaData function.
   */
$(document).ready(function()
{
   resetPage();
   $("#go").click(function (event){
      $("#areaTree").attr('class', 'demo_init2');
      resetPage();
      // second boolean parameter to fake API call and get JSON area data from variable
      getAreaData(null);
   });
})

/**
   * Reset variables, clear previous information
   * output to the page.
   */
function resetPage()
{
   //alert("reset page");
   $("#areaTree").attr('class', 'demo_init1');
   $("#areaTree").empty();
   jsonObject = null;
   jsonAreaData = "";
   obj = null;
   data = [];
   highestLevelNumber = 0
   gotMaxLevelNumber = false;
}


/**
   * Select the filter to use in the ONS API call
   * to extract the appropriate data. If a parent code
   * is supplied then it uses the filter to fetch sub-areas
   * of the parent area using the parent area code.
   * If no parent area is supplied then the top level areas:
   * UK and England and Wales are retrieved.
   * The json data returned is then processed, to convert to
   * the required json format for jstree to use, and then
   * used to populate the area tree.
   *
   * @param parentCode the code (id) of the parent area
   */
function getAreaData(parentCode)
{
   var filterToUse = "";
   var initialiseTree = true;
   
   // To choose a hierarchy you have to also name a dataset to which this hierarchy applies.
   // Hence, the hierarchy and corresponding dataset id are held in the drop-down, separated
   // by a ':'. Here we extract the two pieces of information and insert them into the uri
   // in the appropriate places. (held in format hierarchycode:datasetid)
   var hierarchy_dataset = $("#hierarchy").val();
   language = $("#language").val();
   var arr = hierarchy_dataset.split(":");
   curHierarchy = arr[0];
   //alert('arr 0 = ' + arr[0] + ' arr 1 = ' + arr[1] + ' hierarchy_dataset = ' + hierarchy_dataset);
   //alert('parentCode = ' + parentCode);
   if(parentCode == null)
   {
      	if (arr[0] == "2011WARDH"){
			filterTopLevelAreaNum = 2
		}  
		if (arr[0] == "2011PCONH"){
			filterTopLevelAreaNum = 0
		}
		filterToUse = arr[1] + formatJSON + context + apiKey + hierarchy + arr[0] + filterTopLevelAreas + filterTopLevelAreaNum;
		initialiseTree = true;
   }
   else
   {
      filterToUse = arr[1] + filterSubAreas + parentCode + formatJSON + context + apiKey + hierarchy + arr[0];
      initialiseTree = false;
   }
   
   if(USE_API)
   {
      $.when(getData(filterToUse)).done
      (
         function(data) {
            //alert('got data' + data);
            processData(data, initialiseTree)}
      )
   }
   else
   {
      var data = areaResponse1();
      processData(data, initialiseTree)
   }
}

/**
  * Calls functions to validate the json data and if it is
  * a valid format, reformat it so that it can be used by
  * jsTree to display the data in the area tree. If the
  * initialiseTree parameter is true then the data is added
  * assuming that the top level areas are being added to the
  * tree, otherwise this isn't called. If the data is not
  * of valid json format then a message is displayed to
  * this effect.
  *
  * @param data - the JSON data returned by the ONS API call
  * @param boolean - whether to initialise the tree
  */
function processData(data, initialiseTree) {

  // test if data is valid json format and if so,
  // the the data is stored on the jsonObject
  var success = validateJson(jsonObject, data, false);

  if(success)
  {
     reformatJSONData(jsonObject);

     if(initialiseTree)
     {
        if(USE_API)
        {
           populateTreeInit_API(jsonObject);
        }
        else
        {
           populateTreeInit_NO_API(jsonObject);
        }
     }
  }
  else
  {
     $("#areaTree").attr('class', 'demo');
     $("#areaTree").append("<p>JSON data not a valid format - cannot proceed</p>");
  }
}

/**
   * Makes the API call, requesting the data
   * in JSON format and returns the data,
   * or reports any error.
   *
   * @param filt - various parameters that form part of the ONS API call
   *
   * @return data - the JSON data returned by the ONS API call
   */
function getData(filt)
{
   var url = endpoint + filt;

   //alert('url = ' + url);
   var data;

   //jQuery.support.cors = true;
   $.ajaxSetup({
			//type: "GET",
         data: {},
         //contentType: "application/json",
	 cache: true,
         dataType: "jsonp",
         xhrFields: {
			   withCredentials: true
			},
			crossDomain: true
   });

   return $.ajax({
      url: url,
      timeout: 40000, // 40 second timout because Firefox not firing event handlers for some errors that IE is and request doesn't terminate (although Firebug doesn't show request) - timeout just in case
      //success: function(result,status,xhr){alert("Success! result: " + result + " status: " + status + " xhr = " + xhr);},
      error: function(xhr,status,error){alert("Error! status: " + status + " xhr: " + xhr.status + " error: " + error);$("#areaTree").attr('class', 'demo');$("#areaTree").append("<p>Unable to retrieve data - cannot proceed</p>");}
   })
}

/**
   * Takes the json data and creates the json structure needed
   * for elements within the jstree structure.
   *
   * @param jsonDataset object - the json data received from the api call
   */
function reformatJSONData(obj)
{
   var tree = [];

   tree = extractAreaData(obj);

   obj.tree = tree;
}

/*
 * Used to create a string jsonObject for the supplied area details,
 * in this case just used for the initial area in the tree, UK.
 *
 * @param areaName - the name of the area
 * @param parentCode - name of the parent code for that area
 * @param isParent - boolean whether this area has child areas (sub areas)
 *
 * @return string json for that area
 */
function jsonAreaUK(areaName, parentCode, isParent)
{
   var stringJSON = "";

   if(isParent)
   {
       stringJSON = '{"data": "' + areaName + '" , "attr": {"id": "' + parentCode + '"}, "state" : "open"';
   }
   else
   {
       stringJSON = '{"data": "' + areaName + '" , "attr": {"id": "' + parentCode + '"}';
   }

   return stringJSON;
}

/*
 * Used to create a string jsonObject for the supplied area details.
 *
 * @param areaName - the name of the area
 * @param parentCode - name of the parent code for that area
 * @param isParent - boolean whether this area has child areas (sub areas)
 *
 * @return string json for that area
 */
function jsonArea(areaName, parentCode, areaType, isParent)
{
   var stringJSON = "";

   if(isParent)
   {
       stringJSON = '{"data": "' + areaName + '" , "attr": {"id": "' + parentCode + '", "rel": "' + areaType + '"}, "state" : "closed"}';
   }
   else
   {
       stringJSON = '{"data": "' + areaName + '" , "attr": {"id": "' + parentCode + '", "rel": "' + areaType + '"}}';
   }
   return stringJSON;
}

/*
 * Used to create a string jsonObject for the supplied area details,
 * as a child of previous area. Used for England and Wales to create
 * the initial tree with UK at the top and England and Wales as a 
 * child (sub-area) of the UK.
 *
 * @param areaName - the name of the area
 * @param parentCode - name of the parent code for that area
 * @param isParent - boolean whether this area has child areas (sub areas)
 *
 * @return string json for that area
 */
function jsonAreaChild(areaName, parentCode, isParent)
{
   var stringJSON = null;
   if(isParent)
   {
      stringJSON = '"children" : [[ {"data": "' + areaName + '" , "attr": {"id": "' + parentCode + '"}, "state" : "closed"} ]]}';
   }
   else
   {
      stringJSON = '"children" : [[ {"data": "' + areaName + '" , "attr": {"id": "' + parentCode + '"} } ]]}';
   }
   return stringJSON;
}

/*
 * Loops through the areas held in the JSON data held in the JSONobject
 * and builds up a string of json data in the format required by jstree
 * to populate the tree with the individual areas.
 * and stores the areas name and level type, eg, LA, Ward (if level type present)
 * into an array to be used to output on the chart in, eg, the legend.
 *
 * @param obj - JSONobject holding the data
 *
 * @return  jsonAreaData - string of json data
 *
 */
function extractAreaData(obj)
{
   // Get the list of area items
   var items = obj.ons.geographyList.item;

   jsonAreaData = "";
   var isAParent = true;

   //alert('number of items = ' + items.length);
   if(items.length == undefined)
   {
      // Top level area (England and Wales)
      var areaDetails = items.labels.label[language].$;
      //alert("areaDetails = " + areaDetails);
      var itemCode = items.itemCode;
      //alert("itemCode = " + itemCode);
      var areaType = items.areaType.abbreviation;
      //alert("areaType = " + areaType);

      jsonAreaData = jsonAreaData + jsonArea(areaDetails, itemCode, areaType, isAParent);
   }
   else
   {
      // More than one geography item
      for (i = 0; i < items.length; i++)
      {
         // Get English area name
         var areaDetails = items[i].labels.label[language].$;
         //alert("areaDetails = " + areaDetails);
         // Get parent area code
         var itemCode = items[i].itemCode;
         //alert("itemCode = " + itemCode);
         // Get area type abbreviated
         var areaType = items[i].areaType.abbreviation;
         //alert("areaType = " + areaType);
         // Get area type full
         var areaTypeFull = items[i].areaType.codename;
         // Get current area level number
         var currentLevel = items[i].areaType.level;
         
         //var test = getMaxLevelForAreaTypes(obj);
         //alert('currentLevel = ' + currentLevel + ' getMaxLevelForAreaTypes(obj) = ' + test);

         if((USE_API && currentLevel < getMaxLevelForAreaTypes(obj)) || (!USE_API && currentLevel < 2))
         {
             isAParent = true;
         }
         else
         {
             isAParent = false;
         }

         if(i > 0)
         {
            jsonAreaData = jsonAreaData + ", " + jsonArea(areaDetails, itemCode, areaType, isAParent);
         }
         else
         {
            jsonAreaData = jsonAreaData + jsonArea(areaDetails, itemCode, areaType, isAParent);
         }
      }
   }
   return jsonAreaData;
}

/**
   * Receives xml object and extracts the area types list.
   * Loops through the area types that relate to this hierarchy
   * and gets the level number for each, retaining the highest
   * level number retrieved. This is the maximum area level
   * number that can be expanded to, eg, 'England & Wales' is 0,
   * 'England' is 1, 'South' (a region) is 2, etc.
   * This is used to decide when an area is added to the area tree,
   * whether it has any sub areas, or whether we are at the lowest 
   * level (whether to make it expandable or not).
   *
   */
function getMaxLevelForAreaTypes(obj)
{
   if(!gotMaxLevelNumber)
   {
//alert(curHierarchy);
	if (curHierarchy == '2011PCONH')
	{
		highestLevelNumber = 3;
	}
	if (curHierarchy == '2011WARDH')
	{
		highestLevelNumber = 5;
	}
	if (curHierarchy == '2011STATH')
	{
		highestLevelNumber = 6;
	}
	if (curHierarchy == '2011CMLADH')
	{
		highestLevelNumber = 4;
	}
	if (curHierarchy == '2011HTWARDH')
	{
		highestLevelNumber = 5;
	}

      gotMaxLevelNumber = true;
   }
   return highestLevelNumber;
}

/**
   * Receives the data from the ONS API call and validates it.
   * If the data is valid it is stored on the jsonObject.
   * Optionally alerts the user via a popup of the result.
   *
   * @param jsonObject - object used to hold the parsed JSON data
   * @param data - the json data returned from the ONS API call
   * @param alertUser - boolean whether to display if the data is valid, or not, in a popup
   *
   * @return boolean - whether the data was valid json format
   */
function validateJson(obj, data, alertUser)
{
  try
  {
     obj = jsonObject;
     var json_str = JSON.stringify(data);

     //jsonObject = jQuery.parseJSON(json_str);
     //alert('jsonObject = ' + jsonObject);

     jsonObject = data;

	  if (alertUser)
	  {
        alert("Valid JSON");
	  }
	  return true;
  }
  catch (error)
  {
 	  if (alertUser)
	  {
        alert("Validation failed with error: " + error);
     }
     return false;
  }
}

/*
 * This function is called to initially populate the area tree
 * with the top level area England and Wales. This is done using the
 * jsonAreaData string object passed in with that data in the correct
 * format for jsTree.
 * It also places the separate AJAX call and pre-processing to
 * fetch further data. This is done via the click event. When a
 * node in the tree is clicked and is not already populated with
 * sub-areas, the node is passed through to the function and the
 * parent code attribute is extracted and used to make a further
 * call to the ONSAPI to fetch all sub-areas of that parent code.
 * These are then processed into the required json string structure,
 * as with the top level area, and the json string is parsed as JSON
 * to populate the tree.
 *
 * @param jsonObject
 */
function populateTreeInit_API(obj)
{
   // Remove 'twirly' now the data has been retrieved.
   // The twirly was set as a background with the css class 'demo_init'
   $("#areaTree").attr('class', 'demo');

   var hierarchy_dataset = $("#hierarchy").val();
   var arr = hierarchy_dataset.split(":");

   // Initialise tree
   $("#areaTree").jstree(
   {
      "json_data" : {
            "data" : [
            $.parseJSON("[" + jsonAreaData + "]")
            ],
            "ajax" : {
               "url": function(node) {
                  var nodeId = node.attr("id");
                  //var url = endpoint + "." + formatJSON + context + hierarchy + $("#hierarchy").val() + filterSubAreas + nodeId;
                  var url = endpoint + arr[1] + filterSubAreas + nodeId + formatJSON + context + apiKey + hierarchy + arr[0];
                  //alert('fetching sub area where node id = ' + nodeId + ' url = ' + url);
                  return url;
               },
               "dataType": "jsonp",
               "success": function (new_data) {
                  //alert('new_data = ' + new_data);
                  processData(new_data, false);
                  //alert('jsonAreaData now = ' + jsonAreaData);
                  return $.parseJSON("[" + jsonAreaData + "]");
               },
               error: function (xhr, textstatus, errorThrown) {
                    alert("xhr = " + xhr + " textstatus = " + textstatus + " errorThrown = " + errorThrown);
               }
            }
         },
         "ui" : {

             "select_limit" : 1,
         },
         // This section swaps the default folder icon for a customised one, if the type matches that of the node
         "types" : {
            "types" : {
               "GOR" : {
                  "icon" : {
                     "image" : "img/folder_GOR.bmp"
                  }
               },
               "CTY" : {
                  "icon" : {
                     "image" : "img/folder_COUNTY.bmp"
                  }
               },
               "LA" : {
                  "icon" : {
                     "image" : "img/folder_LA.bmp"
                  }
               },
               "WD" : {
                  "icon" : {
                        "image" : "img/folder_WARD.bmp"
                     }
               },
               "OA" : {
                  "icon" : {
                        "image" : "img/folder_OA.bmp"
                     }
               }
            }
         },
         "plugins" : [ "themes", "json_data", "types", "ui" ]
   });

   // This function requires the 'ui' plugin to be referenced in jsTree
   // and is used to respond to a particular area being clicked. I have
   // set the maximum number that can be selected to 1. You can also add
   // checkboxes to the tree nodes and deal with a number of selections.
   $(function () {
      $("#areaTree")
      .bind("select_node.jstree", function (event, data) {
         var selectedObj = data.rslt.obj;
         //alert("Area Id (parent code): " + selectedObj.attr("id") + "\nArea details: " + data.inst.get_text(data.rslt.obj)); // ID and Node Text
      })
   });

}


/*
 * NON-API Demo version load areas down to level below England and
 * below Wales.
 *
 * This function is called to initially populate the area tree
 * with the top level area England and Wales. This is done using the
 * jsonAreaData string object passed in with that data in the correct
 * format for jsTree.
 *
 * It also ppopulates the tree with further sub-areas when a node
 * is expanded.
 *
 * NOTE: This version does not use the API. The JSON format data
 * is stored in functions below.
 *
 * An event is bound to the opening of a node and this will trigger
 * the fetching of sub-areas and then adds each json area one at a time
 * (not found a way of adding all at once, which is done automatically
 * with the AJAX method using the API above).
 *
 * @param jsonObject
 */
function populateTreeInit_NO_API(obj)
{
   // Remove 'twirly' now the data has been retrieved.
   // The twirly was set as a background with the css class 'demo_init'
   $("#areaTree").attr('class', 'demo');

   var hierarchy_dataset = $("#hierarchy").val();
   var arr = hierarchy_dataset.split(":");

   var CurrentNode = jQuery("#demo").jstree("get_selected");
   //alert('CurrentNode = ' + CurrentNode.id);

   $("#areaTree").jstree(
   {
      "json_data" : {
            "data" : [
            $.parseJSON("[" + jsonAreaData + "]")
            ],
         },
         "ui" : {

             "select_limit" : 1,
         },
         // This section swaps the default folder icon for a customised one, if the type matches that of the node
         "types" : {
            "types" : {
               "GOR" : {
                  "icon" : {
                     "image" : "img/folder_GOR.bmp"
                  }
               },
               "CTY" : {
                  "icon" : {
                     "image" : "img/folder_COUNTY.bmp"
                  }
               },
               "LA" : {
                  "icon" : {
                     "image" : "img/folder_LA.bmp"
                  }
               },
               "WD" : {
                  "icon" : {
                        "image" : "img/folder_WARD.bmp"
                     }
               },
               "OA" : {
                  "icon" : {
                        "image" : "img/folder_OA.bmp"
                     }
               }
            }
         },
         "plugins" : [ "themes", "json_data", "types", "ui", "crrm" ]
   });

   // This function requires the 'ui' plugin to be referenced in jsTree
   // and is used to respond to a particular area being clicked. I have
   // set the maximum number that can be selected to 1. You can also add
   // checkboxes to the tree nodes and deal with a number of selections.
   $(function () {
      $("#areaTree")
      .bind("open_node.jstree", function (event, data) {
         var selectedObj = data.rslt.obj;
         //alert("Area Id (parent code): " + selectedObj.attr("id") + "\nArea details: " + data.inst.get_text(data.rslt.obj)); // ID and Node Text

         // Don't repopulate if areas alreadyy added (done automatically in AJAX/API method above)
         if(selectedObj.children().size() < 3)
         {
            //var textAreaName = data.inst.get_text(data.rslt.obj);
            //var responseNameTrim = removeWhiteSpace(textAreaName);

            var responseAreaId = selectedObj.attr("id");
            var responseName = "areaResponse" + "_" + responseAreaId + "();";
            
            //alert('responseName=' + responseNameTrim);
            var new_data = eval(responseName);
   
            processData(new_data, false);
            //$("#areaTree").jstree("create",selectedObj.attr("id"),"AAA");
            var selectedNodeID = selectedObj.attr("id");

            //alert(selectedObj.attr("id"));
            //alert(jsonAreaData);

            var position = 'inside';
            var parent = $('#areaTree').jstree('get_selected');
            var arrayJSONAreas = jsonAreaData.split('}, {');
   
            // Loop through each JSON area and add each node individually (does it altogether when using an API response)
            for(i=arrayJSONAreas.length-1;i > -1; i--)
            {
               if(i == 0)
               {
                  var jsondata = arrayJSONAreas[i] + "}";
                  //alert('jsondata = ' + jsondata);
                  var expr = '$("#areaTree").jstree("create", "#"+selectedNodeID,  "inside",' + jsondata + ',false, true)';
                  eval(expr);
               }
               else
               {
                  if(i > 0 && i < arrayJSONAreas.length-1)
                  {
                     var jsondata = "{" + arrayJSONAreas[i] + "}";
                     //alert('jsondata = ' + jsondata);
                     var expr = '$("#areaTree").jstree("create", "#"+selectedNodeID,  "inside",' + jsondata + ',false, true)';
                     eval(expr);
                  }
                  else
                  {
                     var jsondata = "{" + arrayJSONAreas[i];
                     //alert('jsondata = ' + jsondata);
                     var expr = '$("#areaTree").jstree("create", "#"+selectedNodeID,  "inside",' + jsondata + ',false, true)';
                     eval(expr);
                  }
               }
            }
         }
      })
   });

}

/*
 * Remove white spaces throughtout a string.
 * Used to remove spaces from area name and use as identifier
 * for which response data to fetch from the function with the
 * same name below.
 */
function removeWhiteSpace (str) {
   return str.replace(/^(\s*)|(\s*)$/g, '').replace(/\s+/g, '');
}

/*
 * Pre-loaded JSON format Area response without going through API
 * Top level area 'England and Wales'
 */
function areaResponse1() {
   var area = '{"ons":{"base":{"@href":"\/ons\/api\/data\/"},"node":{"defurls":{"defurl":[{"@representation":"xml","href":"hierarchy\/QS611EW.json?context=Census&geog=2011WARDH&parent=&levels=0"},{"@representation":"json","href":"hierarchy\/QS611EW.json?context=Census&geog=2011WARDH&parent=&levels=0"}]},"urls":{"url":[{"@representation":"xml","href":"hierarchy\/QS611EW.json?context=Census&apikey=XqL126djgi&geog=2011WARDH&parent=&levels=0"},{"@representation":"json","href":"hierarchy\/QS611EW.json?context=Census&apikey=XqL126djgi&geog=2011WARDH&parent=&levels=0"}]},"description":"","name":"Dataset Hierarchy"},"linkedNodes":{"linkedNode":{"defurls":{"defurl":[{"@representation":"xml","href":"hierarchies\/QS611EW\/def.xml?apikey=XqL126djgicontext=Census"}'
   area = area + ',{"@representation":"json","href":"hierarchies\/QS611EW\/def.json?apikey=XqL126djgicontext=Census"}]},"urls":{"url":[{"@representation":"xml","href":"hierarchies\/QS611EW.xml?apikey=XqL126djgicontext=Census"},{"@representation":"json","href":"hierarchies\/QS611EW.json?apikey=XqL126djgicontext=Census"}]},"name":"Geographical Hierarchies","relation":"parent"}},"geographyList":{"geography":{"id":"2011WARDH","names":{"name":[{"@xml.lang":"en","$":"2011 Ward Admin Hierarchy"},{"@xml.lang":"cy"}]}},"areaTypes":{"areaType":{"abbreviation":"NAT ","codename":"England and Wales","level":0}},"item":{"labels":{"label":[{"@xml.lang":"en","$":"England and Wales"},{"@xml.lang":"cy","$":"Cymru a Lloegr"}]},"itemCode":"K04000001","parentCode":"",'
   area = area + '"areaType":{"abbreviation":"NAT ","codename":"England and Wales","level":0},"subthresholdAreas":{"subthresholdArea":{"labels":{"label":[{"@xml.lang":"en"},{"@xml.lang":"cy"}]},"itemCode":""}}}}}}';
   return jQuery.parseJSON( area );
}

/*
 * Pre-loaded JSON format Area response without going through API
 * Sub areas of 'England and Wales' - parent code = K04000001
 */
function areaResponse_K04000001() {
   var area = '{"ons":{"base":{"@href":"\/ons\/api\/data\/"},"node":{"defurls":{"defurl":[{"@representation":"xml","href":"hierarchy\/QS611EW\/parent\/K04000001.json?context=Census&geog=2011WARDH"},{"@representation":"json","href":"hierarchy\/QS611EW\/parent\/K04000001.json?context=Census&geog=2011WARDH"}]},"urls":{"url":[{"@representation":"xml","href":"hierarchy\/QS611EW\/parent\/K04000001.json?context=Census&apikey=XqL126djgi&geog=2011WARDH"},{"@representation":"json","href":"hierarchy\/QS611EW\/parent\/K04000001.json?context=Census&apikey=XqL126djgi&geog=2011WARDH"}]},"description":"","name":"Dataset Hierarchy"},"linkedNodes":{"linkedNode":{"defurls":{"defurl":[{"@representation":"xml","href":"hierarchies\/QS611EW\/def.xml?apikey=XqL126djgicontext=Census"}'
   area = area + ',{"@representation":"json","href":"hierarchies\/QS611EW\/def.json?apikey=XqL126djgicontext=Census"}]},"urls":{"url":[{"@representation":"xml","href":"hierarchies\/QS611EW.xml?apikey=XqL126djgicontext=Census"},{"@representation":"json","href":"hierarchies\/QS611EW.json?apikey=XqL126djgicontext=Census"}]},"name":"Geographical Hierarchies","relation":"parent"}},"geographyList":{"geography":{"id":"2011WARDH","names":{"name":[{"@xml.lang":"en","$":"2011 Ward Admin Hierarchy"},{"@xml.lang":"cy"}]}},"areaTypes":{"areaType":[{"abbreviation":"CTRY","codename":"Country","level":1},{"abbreviation":"RGN","codename":"Region","level":2},{"abbreviation":"MCTY","codename":"Metropolitan County","level":3},{"abbreviation":"CTY","codename":"County","level":3},'
   area = area + '{"abbreviation":"IOL","codename":"Inner and Outer London","level":3},{"abbreviation":"UA","codename":"Unitary Authority","level":3},{"abbreviation":"LONB","codename":"London Borough ","level":4},{"abbreviation":"MD","codename":"Metropolitan District ","level":4},{"abbreviation":"NMD","codename":"Non-metropolitan District","level":4},{"abbreviation":"WD","codename":"Electoral Ward\/Division ","level":5},{"abbreviation":"WD","codename":"Electoral Division","level":5}]},"item":[{"labels":{"label":[{"@xml.lang":"en","$":"England"},{"@xml.lang":"cy","$":"Lloegr"}]},"itemCode":"E92000001","parentCode":"K04000001","areaType":{"abbreviation":"CTRY","codename":"Country","level":1},"subthresholdAreas":{"subthresholdArea":{"labels":{"label":[{"@xml.lang":"en"}'
   area = area + ',{"@xml.lang":"cy"}]},"itemCode":""}}},{"labels":{"label":[{"@xml.lang":"en","$":"Wales"},{"@xml.lang":"cy","$":"Cymru"}]},"itemCode":"W92000004","parentCode":"K04000001","areaType":{"abbreviation":"CTRY","codename":"Country","level":1},"subthresholdAreas":{"subthresholdArea":{"labels":{"label":[{"@xml.lang":"en"},{"@xml.lang":"cy"}]},"itemCode":""}}}]}}}';
   return jQuery.parseJSON( area );
}
/*
 * Pre-loaded JSON format Area response without going through API
 * Sub areas of 'England' - parent code = E92000001
 */
function areaResponse_E92000001() {
   var area = '{"ons":{"base":{"@href":"\/ons\/api\/data\/"},"node":{"defurls":{"defurl":[{"@representation":"xml","href":"hierarchy\/QS611EW\/parent\/E92000001.json?context=Census&geog=2011WARDH"},{"@representation":"json","href":"hierarchy\/QS611EW\/parent\/E92000001.json?context=Census&geog=2011WARDH"}]},"urls":{"url":[{"@representation":"xml","href":"hierarchy\/QS611EW\/parent\/E92000001.json?context=Census&apikey=XqL126djgi&geog=2011WARDH"},{"@representation":"json","href":"hierarchy\/QS611EW\/parent\/E92000001.json?context=Census&apikey=XqL126djgi&geog=2011WARDH"}]},"description":"","name":"Dataset Hierarchy"},"linkedNodes":{"linkedNode":{"defurls":{"defurl":[{"@representation":"xml","href":"hierarchies\/QS611EW\/def.xml?apikey=XqL126djgicontext=Census"}'
   area = area + ',{"@representation":"json","href":"hierarchies\/QS611EW\/def.json?apikey=XqL126djgicontext=Census"}]},"urls":{"url":[{"@representation":"xml","href":"hierarchies\/QS611EW.xml?apikey=XqL126djgicontext=Census"},{"@representation":"json","href":"hierarchies\/QS611EW.json?apikey=XqL126djgicontext=Census"}]},"name":"Geographical Hierarchies","relation":"parent"}},"geographyList":{"geography":{"id":"2011WARDH","names":{"name":[{"@xml.lang":"en","$":"2011 Ward Admin Hierarchy"},{"@xml.lang":"cy"}]}},"areaTypes":{"areaType":[{"abbreviation":"RGN","codename":"Region","level":2},{"abbreviation":"MCTY","codename":"Metropolitan County","level":3},{"abbreviation":"CTY","codename":"County","level":3},{"abbreviation":"IOL","codename":"Inner and Outer London"'
   area = area + ',"level":3},{"abbreviation":"UA","codename":"Unitary Authority","level":3},{"abbreviation":"NMD","codename":"Non-metropolitan District","level":4},{"abbreviation":"LONB","codename":"London Borough ","level":4},{"abbreviation":"MD","codename":"Metropolitan District ","level":4},{"abbreviation":"WD","codename":"Electoral Ward\/Division ","level":5}]},"item":[{"labels":{"label":[{"@xml.lang":"en","$":"North East"},{"@xml.lang":"cy","$":"North East"}]},"itemCode":"E12000001","parentCode":"E92000001","areaType":{"abbreviation":"RGN","codename":"Region","level":2},"subthresholdAreas":{"subthresholdArea":{"labels":{"label":[{"@xml.lang":"en"},{"@xml.lang":"cy"}]},"itemCode":""}}},{"labels":{"label":[{"@xml.lang":"en","$":"North West"},{"@xml.lang":"cy"'
   area = area + ',"$":"North West"}]},"itemCode":"E12000002","parentCode":"E92000001","areaType":{"abbreviation":"RGN","codename":"Region","level":2},"subthresholdAreas":{"subthresholdArea":{"labels":{"label":[{"@xml.lang":"en"},{"@xml.lang":"cy"}]},"itemCode":""}}},{"labels":{"label":[{"@xml.lang":"en","$":"Yorkshire and The Humber"},{"@xml.lang":"cy","$":"Yorkshire and The Humber"}]},"itemCode":"E12000003","parentCode":"E92000001","areaType":{"abbreviation":"RGN","codename":"Region","level":2},"subthresholdAreas":{"subthresholdArea":{"labels":{"label":[{"@xml.lang":"en"},{"@xml.lang":"cy"}]},"itemCode":""}}},{"labels":{"label":[{"@xml.lang":"en","$":"East Midlands"},{"@xml.lang":"cy","$":"East Midlands"}]},"itemCode":"E12000004","parentCode":"E92000001"'
   area = area + ',"areaType":{"abbreviation":"RGN","codename":"Region","level":2},"subthresholdAreas":{"subthresholdArea":{"labels":{"label":[{"@xml.lang":"en"},{"@xml.lang":"cy"}]},"itemCode":""}}},{"labels":{"label":[{"@xml.lang":"en","$":"West Midlands"},{"@xml.lang":"cy","$":"West Midlands"}]},"itemCode":"E12000005","parentCode":"E92000001","areaType":{"abbreviation":"RGN","codename":"Region","level":2},"subthresholdAreas":{"subthresholdArea":{"labels":{"label":[{"@xml.lang":"en"},{"@xml.lang":"cy"}]},"itemCode":""}}},{"labels":{"label":[{"@xml.lang":"en","$":"East of England"},{"@xml.lang":"cy","$":"East of England"}]},"itemCode":"E12000006","parentCode":"E92000001","areaType":{"abbreviation":"RGN","codename":"Region","level":2},'
   area = area + '"subthresholdAreas":{"subthresholdArea":{"labels":{"label":[{"@xml.lang":"en"},{"@xml.lang":"cy"}]},"itemCode":""}}},{"labels":{"label":[{"@xml.lang":"en","$":"London"},{"@xml.lang":"cy","$":"London"}]},"itemCode":"E12000007","parentCode":"E92000001","areaType":{"abbreviation":"RGN","codename":"Region","level":2},"subthresholdAreas":{"subthresholdArea":{"labels":{"label":[{"@xml.lang":"en"},{"@xml.lang":"cy"}]},"itemCode":""}}},{"labels":{"label":[{"@xml.lang":"en","$":"South East"},{"@xml.lang":"cy","$":"South East"}]},"itemCode":"E12000008","parentCode":"E92000001","areaType":{"abbreviation":"RGN","codename":"Region","level":2},"subthresholdAreas":{"subthresholdArea":{"labels":{"label":[{"@xml.lang":"en"},{"@xml.lang":"cy"}]},"itemCode":""}}},'
   area = area + '{"labels":{"label":[{"@xml.lang":"en","$":"South West"},{"@xml.lang":"cy","$":"South West"}]},"itemCode":"E12000009","parentCode":"E92000001","areaType":{"abbreviation":"RGN","codename":"Region","level":2},"subthresholdAreas":{"subthresholdArea":{"labels":{"label":[{"@xml.lang":"en"},{"@xml.lang":"cy"}]},"itemCode":""}}}]}}}';
   return jQuery.parseJSON( area );
}
/*
 * Pre-loaded JSON format Area response without going through API
 * Sub areas of 'Wales' - parent code = W92000004
 */
function areaResponse_W92000004() {
   var area = '{"ons":{"base":{"@href":"\/ons\/api\/data\/"},"node":{"defurls":{"defurl":[{"@representation":"xml","href":"hierarchy\/QS611EW\/parent\/W92000004.json?context=Census&geog=2011WARDH"},{"@representation":"json","href":"hierarchy\/QS611EW\/parent\/W92000004.json?context=Census&geog=2011WARDH"}]},"urls":{"url":[{"@representation":"xml","href":"hierarchy\/QS611EW\/parent\/W92000004.json?context=Census&apikey=XqL126djgi&geog=2011WARDH"},{"@representation":"json","href":"hierarchy\/QS611EW\/parent\/W92000004.json?context=Census&apikey=XqL126djgi&geog=2011WARDH"}]},"description":"","name":"Dataset Hierarchy"},"linkedNodes":{"linkedNode":{"defurls":{"defurl":[{"@representation":"xml","href":"hierarchies\/QS611EW\/def.xml?apikey=XqL126djgicontext=Census"}'
   area = area + ',{"@representation":"json","href":"hierarchies\/QS611EW\/def.json?apikey=XqL126djgicontext=Census"}]},"urls":{"url":[{"@representation":"xml","href":"hierarchies\/QS611EW.xml?apikey=XqL126djgicontext=Census"},{"@representation":"json","href":"hierarchies\/QS611EW.json?apikey=XqL126djgicontext=Census"}]},"name":"Geographical Hierarchies","relation":"parent"}},"geographyList":{"geography":{"id":"2011WARDH","names":{"name":[{"@xml.lang":"en","$":"2011 Ward Admin Hierarchy"},{"@xml.lang":"cy"}]}},"areaTypes":{"areaType":[{"abbreviation":"UA","codename":"Unitary Authority","level":3},{"abbreviation":"WD","codename":"Electoral Division","level":5}]},"item":[{"labels":{"label":[{"@xml.lang":"en","$":"Isle of Anglesey"},{"@xml.lang":"cy","$":"Ynys Môn"}]},'
   area = area + '"itemCode":"W06000001","parentCode":"W92000004","areaType":{"abbreviation":"UA","codename":"Unitary Authority","level":3},"subthresholdAreas":{"subthresholdArea":{"labels":{"label":[{"@xml.lang":"en"},{"@xml.lang":"cy"}]},"itemCode":""}}},{"labels":{"label":[{"@xml.lang":"en","$":"Gwynedd"},{"@xml.lang":"cy","$":"Gwynedd"}]},"itemCode":"W06000002","parentCode":"W92000004","areaType":{"abbreviation":"UA","codename":"Unitary Authority","level":3},"subthresholdAreas":{"subthresholdArea":{"labels":{"label":[{"@xml.lang":"en"},{"@xml.lang":"cy"}]},"itemCode":""}}},'
   area = area + '{"labels":{"label":[{"@xml.lang":"en","$":"Conwy"},{"@xml.lang":"cy","$":"Conwy"}]},"itemCode":"W06000003","parentCode":"W92000004","areaType":{"abbreviation":"UA","codename":"Unitary Authority","level":3},"subthresholdAreas":{"subthresholdArea":{"labels":{"label":[{"@xml.lang":"en"},{"@xml.lang":"cy"}]},"itemCode":""}}},{"labels":{"label":[{"@xml.lang":"en","$":"Denbighshire"},{"@xml.lang":"cy","$":"Sir Ddinbych"}]},"itemCode":"W06000004","parentCode":"W92000004","areaType":{"abbreviation":"UA","codename":"Unitary Authority","level":3},"subthresholdAreas":{"subthresholdArea":{"labels":{"label":[{"@xml.lang":"en"},{"@xml.lang":"cy"}]},"itemCode":""}}},'
   area = area + '{"labels":{"label":[{"@xml.lang":"en","$":"Flintshire"},{"@xml.lang":"cy","$":"Sir y Fflint"}]},"itemCode":"W06000005","parentCode":"W92000004","areaType":{"abbreviation":"UA","codename":"Unitary Authority","level":3},"subthresholdAreas":{"subthresholdArea":{"labels":{"label":[{"@xml.lang":"en"},{"@xml.lang":"cy"}]},"itemCode":""}}},{"labels":{"label":[{"@xml.lang":"en","$":"Wrexham"},{"@xml.lang":"cy","$":"Wrecsam"}]},"itemCode":"W06000006","parentCode":"W92000004","areaType":{"abbreviation":"UA","codename":"Unitary Authority","level":3},"subthresholdAreas":{"subthresholdArea":{"labels":{"label":[{"@xml.lang":"en"},{"@xml.lang":"cy"}]},"itemCode":""}}},'
   area = area + '{"labels":{"label":[{"@xml.lang":"en","$":"Powys"},{"@xml.lang":"cy","$":"Powys"}]},"itemCode":"W06000023","parentCode":"W92000004","areaType":{"abbreviation":"UA","codename":"Unitary Authority","level":3},"subthresholdAreas":{"subthresholdArea":{"labels":{"label":[{"@xml.lang":"en"},{"@xml.lang":"cy"}]},"itemCode":""}}},{"labels":{"label":[{"@xml.lang":"en","$":"Ceredigion"},{"@xml.lang":"cy","$":"Ceredigion"}]},"itemCode":"W06000008","parentCode":"W92000004","areaType":{"abbreviation":"UA","codename":"Unitary Authority","level":3},"subthresholdAreas":{"subthresholdArea":{"labels":{"label":[{"@xml.lang":"en"},{"@xml.lang":"cy"}]},"itemCode":""}}},'
   area = area + '{"labels":{"label":[{"@xml.lang":"en","$":"Pembrokeshire"},{"@xml.lang":"cy","$":"Sir Benfro"}]},"itemCode":"W06000009","parentCode":"W92000004","areaType":{"abbreviation":"UA","codename":"Unitary Authority","level":3},"subthresholdAreas":{"subthresholdArea":{"labels":{"label":[{"@xml.lang":"en"}'
   area = area + ',{"@xml.lang":"cy"}]},"itemCode":""}}},{"labels":{"label":[{"@xml.lang":"en","$":"Carmarthenshire"},{"@xml.lang":"cy","$":"Sir Gaerfyrddin"}]},"itemCode":"W06000010","parentCode":"W92000004","areaType":{"abbreviation":"UA","codename":"Unitary Authority","level":3},"subthresholdAreas":{"subthresholdArea":{"labels":{"label":[{"@xml.lang":"en"},{"@xml.lang":"cy"}]},"itemCode":""}}},{"labels":{"label":[{"@xml.lang":"en","$":"Swansea"},{"@xml.lang":"cy","$":"Abertawe"}]},"itemCode":"W06000011","parentCode":"W92000004","areaType":{"abbreviation":"UA","codename":"Unitary Authority","level":3}'
   area = area + ',"subthresholdAreas":{"subthresholdArea":{"labels":{"label":[{"@xml.lang":"en"},{"@xml.lang":"cy"}]},"itemCode":""}}},{"labels":{"label":[{"@xml.lang":"en","$":"Neath Port Talbot"},{"@xml.lang":"cy","$":"Castell-nedd Port Talbot"}]},"itemCode":"W06000012","parentCode":"W92000004","areaType":{"abbreviation":"UA","codename":"Unitary Authority","level":3},"subthresholdAreas":{"subthresholdArea":{"labels":{"label":[{"@xml.lang":"en"},{"@xml.lang":"cy"}]},"itemCode":""}}},{"labels":{"label":[{"@xml.lang":"en","$":"Bridgend"},{"@xml.lang":"cy","$":"Pen-y-bont ar Ogwr"}]},"itemCode":"W06000013","parentCode":"W92000004","areaType":{"abbreviation":"UA","codename":"Unitary Authority","level":3},"subthresholdAreas":{"subthresholdArea":{"labels":{"label":[{"@xml.lang":"en"},{"@xml.lang":"cy"}]},"itemCode":""}}},{"labels":{"label":[{"@xml.lang":"en","$":"The Vale of Glamorgan"},{"@xml.lang":"cy","$":"Bro Morgannwg"}]},'
   area = area + '"itemCode":"W06000014","parentCode":"W92000004","areaType":{"abbreviation":"UA","codename":"Unitary Authority","level":3},"subthresholdAreas":{"subthresholdArea":{"labels":{"label":[{"@xml.lang":"en"},{"@xml.lang":"cy"}]},"itemCode":""}}},{"labels":{"label":[{"@xml.lang":"en","$":"Cardiff"},{"@xml.lang":"cy","$":"Caerdydd"}]},"itemCode":"W06000015","parentCode":"W92000004","areaType":{"abbreviation":"UA","codename":"Unitary Authority","level":3},"subthresholdAreas":{"subthresholdArea":{"labels":{"label":[{"@xml.lang":"en"},{"@xml.lang":"cy"}]},"itemCode":""}}},{"labels":{"label":[{"@xml.lang":"en","$":"Rhondda Cynon Taf"},{"@xml.lang":"cy","$":"Rhondda Cynon Taf"}]},"itemCode":"W06000016","parentCode":"W92000004","areaType":{"abbreviation":"UA","codename":"Unitary Authority","level":3},"subthresholdAreas":{"subthresholdArea":{"labels":{"label":[{"@xml.lang":"en"},{"@xml.lang":"cy"}]},"itemCode":""}}},{"labels":{"label":[{"@xml.lang":"en","$":"Merthyr Tydfil"},'
   area = area + '{"@xml.lang":"cy","$":"Merthyr Tudful"}]},"itemCode":"W06000024","parentCode":"W92000004","areaType":{"abbreviation":"UA","codename":"Unitary Authority","level":3},"subthresholdAreas":{"subthresholdArea":{"labels":{"label":[{"@xml.lang":"en"},{"@xml.lang":"cy"}]},"itemCode":""}}},{"labels":{"label":[{"@xml.lang":"en","$":"Caerphilly"},{"@xml.lang":"cy","$":"Caerffili"}]},"itemCode":"W06000018","parentCode":"W92000004","areaType":{"abbreviation":"UA","codename":"Unitary Authority","level":3},"subthresholdAreas":{"subthresholdArea":{"labels":{"label":[{"@xml.lang":"en"},{"@xml.lang":"cy"}]},"itemCode":""}}},{"labels":{"label":[{"@xml.lang":"en","$":"Blaenau Gwent"},{"@xml.lang":"cy","$":"Blaenau Gwent"}]},"itemCode":"W06000019","parentCode":"W92000004","areaType":{"abbreviation":"UA","codename":"Unitary Authority","level":3},"subthresholdAreas":{"subthresholdArea":{"labels":{"label":[{"@xml.lang":"en"},{"@xml.lang":"cy"}]},'
   area = area + '"itemCode":""}}},{"labels":{"label":[{"@xml.lang":"en","$":"Torfaen"},{"@xml.lang":"cy","$":"Tor-faen"}]},"itemCode":"W06000020","parentCode":"W92000004","areaType":{"abbreviation":"UA","codename":"Unitary Authority","level":3},"subthresholdAreas":{"subthresholdArea":{"labels":{"label":[{"@xml.lang":"en"},{"@xml.lang":"cy"}]},"itemCode":""}}},{"labels":{"label":[{"@xml.lang":"en","$":"Monmouthshire"},{"@xml.lang":"cy","$":"Sir Fynwy"}]},"itemCode":"W06000021","parentCode":"W92000004","areaType":{"abbreviation":"UA","codename":"Unitary Authority","level":3},"subthresholdAreas":{"subthresholdArea":{"labels":{"label":[{"@xml.lang":"en"},{"@xml.lang":"cy"}]},"itemCode":""}}},{"labels":{"label":[{"@xml.lang":"en","$":"Newport"},{"@xml.lang":"cy","$":"Casnewydd"}]},"itemCode":"W06000022","parentCode":"W92000004","areaType":{"abbreviation":"UA","codename":"Unitary Authority","level":3},"subthresholdAreas":{"subthresholdArea":{"labels":{"label":[{"@xml.lang":"en"},{"@xml.lang":"cy"}]},"itemCode":""}}}]}}}';
   return jQuery.parseJSON( area );
}