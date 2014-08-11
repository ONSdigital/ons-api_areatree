ons-api_areatree
================

This demo is built using HTML, JavaScript and uses the open source JavaScript libraries: JQuery and JSTree. It should work on any modern web browser.
 
The "Initialise Area Tree" button populates the tree with the top level area for the hierarchy being used. The sub-areas are populated as an area node is expanded. The areas are retrieved via an API call and the appropriate areas are returned in JSON format. The JSON data is then processed and used to populate the tree. If an area is contracted and then re-expanded the areas do not have to be fetched again.
 
Note: You will need to insert your own API Key into the javascript file "area_utils.js", replacing the text after the equals sign in the variable var apiKey = "&apikey=INSERT_YOUR_API_KEY_HERE" with the actual value of the key.