//json2csv and cheerio
//Require https module
const fs = require('fs');
const {URL, URLSearchParams} = require('url');
const myURL = new URL(`http://shirts4mike.com/shirts.php`);
const url = `http://shirts4mike.com/shirts.php`;
const urlMain = `http://shirts4mike.com/`;
const priceData = [];
const date = new Date();
const hour = date.getUTCHours(),
	min = date.getUTCMinutes(),
	sec = date.getUTCSeconds();
//myURL.searchParams.append('id', '101');
//console.log(myURL.href);
   
//Create 'data' folder if it doesn't exist
!fs.existsSync('data') ? fs.mkdirSync('data') : false;

//Save file based on date created
const year = date.getFullYear(),
      month = date.getMonth(),
      day = date.getDate();
let saveDateFile = `${year}-${month}-${day}`;
let file = `./data/${saveDateFile}.csv`;

// initiate scraper to get price, title, url and img url
const scrapeIt = require("scrape-it");
// Promise interface
scrapeIt(url, {
	shirts: {
		listItem: '.products li',
		data: {
			title: {
				selector: 'a img',
				attr: 'alt'
			},
			shirtsUrl: {
				selector: 'a',
				attr: 'href',
				convert: x => urlMain + x
			},
			imageURL: {
				selector: 'a img',
				attr: 'src',
				convert: x => urlMain + x
			}
		}
	}
}).then(data => {
	//shirts array
	const shirtArray = data.shirts;

	//loop through the shirts and get price for each
	shirtArray.forEach(function(element, i) {
		const shirtURL = element.shirtsUrl;
		priceData.push(shirtURL);
		//scrape info from specific shirt pages
		scrapeIt(priceData[i], {
			shirts: {
				listItem: 'h1',
				data: {
					price: {
						selector: '.price'
					}
				}
			}
		}).then(shirts => {
			shirtArray[i].price = shirts.shirts[1].price;
			shirtArray[i].time = `${hour}:${min}:${sec}`;
			//console.log(data);
			// initiate json2csv
			const json2csv = require('json2csv');
			const fields = ['title', 'price', 'shirtsUrl', 'imageURL', 'time'],
				fieldNames = ['Shirt Title', 'Price', 'Shirt URL', 'Shirt Image URL', 'Time'],
				csv = json2csv({data: shirtArray, fields: fields, fieldNames: fieldNames});

			fs.writeFile(file, csv, function(err) {
				if(err) throw err;
			});
		});
	});
}).catch((e) => {
	//catch any 404 errors and log message, as well as create an error log file
    let toDate = date.toDateString(),
        time = date.toTimeString(),
        fullDate = `${toDate} ${time}`;
        
    if(e.code === "ENOTFOUND"){
      if(!fs.existsSync('scraper-error.log')){
        const options = `Could not complete network connection: ${fullDate} | ${e.code}`;
        fs.writeFile('./data/scraper-error.log', options, () => {
          console.log("Error File Created. Check scraper-error.log file for details.");
         });
      }
    }
});


