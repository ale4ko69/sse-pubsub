
/**
 * How to use: dateid(new Date().toJSON());
 * @param {ISODateString} date
 */
function dateid(date) {
	const numericArray = new Array();
	date
	  .split("T")[0]
	  .split("-")
	  .forEach((ele) => numericArray.push(parseInt(ele))); // split the dateTime string into parts and sum them

	date
	  .split("T")[1]
	  .split(":")
	  .forEach((ele) => numericArray.push(parseFloat(ele)));

	const id = numericArray.reduce(reducer);
	// log the new generated id, substr can be used to change the length of numeric ID
	return id.toString().replace(".", "").substr(1, 6);


	/**
	* @param {number} accumulator - each element of the array
	* @param {number} currentValue - any additional vallue to be added
	*/
	function reducer(accumulator, currentValue) {
		return accumulator + currentValue;
	}
}

module.exports = dateid;
