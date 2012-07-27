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
