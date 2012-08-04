/* Get size
 * Requires: object
 * Returns: size
 */
exports.getObjectSize = function(obj) {
    var size = 0;

    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        size ++;
      }
    }

    return size;
};

/* Load a JSON object
 * Requires: object
 * Returns: existing object or new object
 */
exports.loadJSONObject = function(obj) {
  try {
    obj = JSON.parse(obj);
  } catch(err) {
    console.error('Object could not be loaded, make new one');
    obj = {};
  }

  return obj;
}