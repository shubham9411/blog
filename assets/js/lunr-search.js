function urlToTitle(refer) {
  refer = refer.substring(1, refer.length - 1);
  return refer.split('-').join(' ');
}

function highlightText(sTH,index,textToHighlight){
  return sTH.substring(0,index) + "<span class='highlightText'>" + textToHighlight + "</span>" + sTH.substring(index + textToHighlight.length);
}

function getMoreData(index, data, originalData, searchTerm) {

  originalData = originalData[data[index]].content.toLowerCase().split('.');
  for(var integ in originalData){

    var indexVal = originalData[integ].indexOf(searchTerm);
    if (indexVal > -1){
      return highlightText(originalData[integ],indexVal,searchTerm);
    }
  }
  return '';

}

function getHtmlData( urltext, searchTerm ) {
  urltext = "/blog" + urltext;
  $.ajax({url: urltext}).done(function(data){
    console.log(searchTerm);
    var indx = data.indexOf(searchTerm);
    console.log('the index is '+indx);
    return data;
  });
}

function getSearchText(opt,search){
  console.log('inside seartchtext '+ opt);
  if (opt == "All" || opt == undefined){
    return search;
  }
  else{
    return opt + " " + search;
  }
}

$(document).ready(function() {
  var idx = '';
  var result = [];
  var jsonData = {};
  var originalJsonData = {};
  $.getJSON("/blog/search.json", function(json) {
    // this will show the info it in firebug console
    idx = lunr(function() {
      this.field('category',{ boost: 100})
      this.field('title', {
        boost: 10
      })
      this.field('content')
      this.ref('url')
    })
    for (var index in json) {
      idx.add(json[index]);
      jsonData[json[index].url] = Number(index);
    }
    originalJsonData = json;

  });
  $('#search-box').keyup(function() {
    var textToInsert = '';
    var highlighted = '';
    // search value will add category to the search term, so we only get posts from category
    var searchValue = getSearchText($( ".insertCategory" ).val(), this.value);
    if (this.value.length >= 3){
      result = idx.search(searchValue);
      var searchArray = [];
      if (result.length > 0) {
        var sliceText = "<a  class='search-results list-group-item' href='/blog"
        for (var index in result) {
          textToInsert = textToInsert + sliceText + result[index].ref + " '> <b>" + urlToTitle(result[index].ref) + "</b><br><p class='list-group-item-text'>";
          highlighted = getMoreData(result[index].ref, jsonData, originalJsonData, this.value) + "</p></a>"
          console.log(getHtmlData(result[index].ref,this.value));
          textToInsert = textToInsert + highlighted;
        }

      }
      console.log('the text to insert is '+ textToInsert);
      if (textToInsert == '') {
        textToInsert = "<a class='search-results list-group-item' href='#'> No results found </a>";
      }

      $('#search-dropdown').html(textToInsert);

      $('.search-results').hover(function(){
        $('#search-box').width(400);
      });
    }
    else{
      $('#search-dropdown').html("<a class='search-results list-group-item'> Enter atleast 3 characters.. </a>");
    }

  });


})

$(document).ready(function(){

  $(".selectCategory").click(function(){
    $('.insertCategory').html($(this).attr("id") + "&nbsp;<span class='caret'></span>");
    $('.insertCategory').val($(this).attr("id"));
  });
})





// $().keyPress


// init lunr