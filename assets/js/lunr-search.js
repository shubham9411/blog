---
---

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
    $.getJSON("{{ site.url }}{{ site.baseurl }}/search.json", function(json) {
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
                var sliceText = "<li role='presentation' class='search-results list-group-item'><a role='menuitem' tabindex='-1' href=' "
                for (var index in result) {
                    textToInsert = textToInsert + sliceText + result[index].ref + " '> <b>" + urlToTitle(result[index].ref) + "</b><br>";
                    highlighted = getMoreData(result[index].ref, jsonData, originalJsonData, this.value) + "</a></li>"
                    textToInsert = textToInsert + highlighted;
                }

            }
            if (textToInsert == '') {
                textToInsert = "<li class='search-results'> No results found </li>";
            }
            $('#search-dropdown').html(textToInsert);
        }
        else{
            $('#search-dropdown').html("<li class='search-results'> Enter atleast 3 characters.. </li>");
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