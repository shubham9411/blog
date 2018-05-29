// this file helps in searching

// this template came from cloudcannon's course, search for searching using lunr.js
// link to git repo: https://github.com/CloudCannon/bakery-store-jekyll-template/tree/lunrjs


(function() {
  function displaySearchResults(results, store) {
    var searchResults = document.getElementById('search-results');

    if (results.length) { // Are there any results?
      var appendString = '';

      for (var i = 0; i < results.length; i++) {  // Iterate over the results
        var item = store[results[i].ref];

        //the heading first
        appendString += '<li><a href="/blog' + item.url + '"><h3>' + item.title + '</h3></a>';

        //content of the post, truncated to first 150 characters
        appendString += '<p>' + item.content.substring(0, 150) + '...</p></li>';
      }

      searchResults.innerHTML = appendString;
    }

    else {
      searchResults.innerHTML = '<li>No results found</li>';
    }
    
  }

// work starts from here,
// this is step 1

  function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');

    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split('=');

      if (pair[0] === variable) {
        return decodeURIComponent(pair[1].replace(/\+/g, '%20'));
      }
    }
  }

  var searchTerm = getQueryVariable('query');
  // above line returns all the words typed in by the user, seperated by space
  // datatype of searchTerm is string, not array




//this is step 2
//in case the string "searchTerm" is empty, below step won't be performed


  if (searchTerm) {
    document.getElementById('search-box').setAttribute("value", searchTerm);

    // Initalize lunr with the fields it will be searching on. I've given title
    // a boost of 10 to indicate matches on this field are more important.

  // bakery code starts
    /*
    var idx = lunr(function () {
      this.field('id');
      this.field('title', { boost: 10 });
      this.field('author');
      this.field('category');
      this.field('content');
    });
    */
  // bakery code ends


    var idx = lunr(function () {
      this.field('id');
      this.field('category', { boost: 8 });
      this.field('title', { boost: 4 });
      this.field('content');

      //below line is not working
      //this.ref('url');
    });



    for (var key in window.store) { // Add the data to lunr
      idx.add({
        'id': key,
        'title': window.store[key].title,
        'author': window.store[key].author,
        'category': window.store[key].category,
        'content': window.store[key].content
      });

      var results = idx.search(searchTerm); // Get lunr to perform a search
      displaySearchResults(results, window.store); // We'll write this in the next section
    }
  }
})();



//// for console testing only ////

//// copy paste the below code in console one section at a time ////

//// then see the value of searchTerm, searchResults, results, window.store ////


/*

============================================

// work starts from here,
// this is step 1

  function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');

    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split('=');

      if (pair[0] === variable) {
        return decodeURIComponent(pair[1].replace(/\+/g, '%20'));
      }
    }
  }

  var searchTerm = getQueryVariable('query');
// above line returns all the words typed in by the user, seperated by space
// datatype of searchTerm is string, not array

============================================

function displaySearchResults(results, store) {
    var searchResults = document.getElementById('search-results');

    if (results.length) { // Are there any results?
      var appendString = '';

      for (var i = 0; i < results.length; i++) {  // Iterate over the results
        var item = store[results[i].ref];

        //the heading first
        appendString += '<li><a href="/blog' + item.url + '"><h3>' + item.title + '</h3></a>';

        //content of the post, truncated to first 150 characters
        appendString += '<p>' + item.content.substring(0, 150) + '...</p></li>';
      }

      searchResults.innerHTML = appendString;
    }

    else {
      searchResults.innerHTML = '<li>No results found</li>';
    }

  }


  if (searchTerm) {
    document.getElementById('search-box').setAttribute("value", searchTerm);

    // Initalize lunr with the fields it will be searching on. I've given title
    // a boost of 10 to indicate matches on this field are more important.

    var idx = lunr(function () {
      this.field('id');
      this.field('category', { boost: 100});
      this.field('title', { boost: 10 });
      this.field('content');

      //below line is not working
      //this.ref('url');
    });


    for (var key in window.store) { // Add the data to lunr
      idx.add({
        'id': key,
        'title': window.store[key].title,
        'author': window.store[key].author,
        'category': window.store[key].category,
        'content': window.store[key].content
      });

      var results = idx.search(searchTerm); // Get lunr to perform a search
      displaySearchResults(results, window.store); // We'll write this in the next section
    }
  }
*/
