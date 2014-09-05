//Ongoing work for local storage search
// var search = {};
// search.indexedDB = {};
// search.indexedDB.db = null;

// search.indexedDB.open = function() {
//     var version = 1;
//     var request = indexedDB.open("content",version);
//     request.onupgradeneeded = function(e){
//         var db = e.target.result;
//         e.target.transaction.onerror = search.indexedDB.onerror;
//         if (db.objectStoreNames.contains("content")){
//             db.deleteObjectStore("content");
//         }
//         var store = db.createObjectStore("content", {keyPath: "id"});
//     };
    
//     request.onsuccess = function(e){
//         search.indexedDB.db = e.target.result;
//         search.indexedDb.getAllContentItems();
//     };
    
//     request.onerror = search.indexedDB.onerror;
// };
// search.indexedDb.addContent = function(contentText){
//     var db = search.indexedDB.db;
//     var trans = db.transaction(["content"],"readwrite");
//     var store = trans.objectStore("content");
//     var request = store.put({
//         "text": contentText,
//         "id": 1
//     });
//     request.onsuccess = function(e){
//         search.indexedDB.getAllContentItems();
//     };
//     request.onerror = function(e){
//         console.log(e.value);
//     }
// }

// search.indexedDB.getAllContentItems = function(){
//     var db = search.indexedDB.db;
//     var trans = db.transaction(["content"],"readwrite");
//     var store = trans.objectStore("content");
//     var keyRange = IDBKeyRange.lowerBound(0);
//     var cursorRequest = store.openCursor(keyRange);
    
//     cursorRequest.onsuccess = function(e) {
//         var result = e.target.result;
//         if (!!result == false)
//             return;
//         console.log(result.value);
//         result.continue();
//     };
    
//     cursorRequest.onerror = search.indexedDB.onerror;
//     }
// }