var express = require('express'),
	sm = require('sitemap'),
	fs = require('fs');

var request = require("request");
var bodyParser = require('body-parser');
var app = express();
var sitemap;

app.use(bodyParser.urlencoded({
	parameterLimit: 100000,
	limit: '50mb',
	extended: true
}));

app.use(bodyParser.json({
	parameterLimit: 100000,
	limit: '50mb',
	extended: true
}));

var distinctCities1 = [{
	"city": "Brunswick",
	"state": "Victoria",
	"post_code": "3056",
	"lat": -37.764829,
	"lng": 144.943778
}, {
	"city": "Carlton",
	"state": "Victoria",
	"post_code": "3053",
	"lat": -37.784337,
	"lng": 144.969747
}, {
	"city": "Kew",
	"state": "Victoria",
	"post_code": "3101",
	"lat": -37.797982,
	"lng": 145.053727
}, {
	"city": "Kew East",
	"state": "Victoria",
	"post_code": "3102",
	"lat": -37.842632,
	"lng": 144.977707
}, {
	"city": "Melbourne",
	"state": "Victoria",
	"post_code": "3000",
	"lat": -37.814563,
	"lng": 144.970267
}, {
	"city": "Preston",
	"state": "Victoria",
	"post_code": "3072",
	"lat": -37.738736,
	"lng": 145.000515
}, {
	"city": "Richmond",
	"state": "Victoria",
	"post_code": "3121",
	"lat": -37.818587,
	"lng": 144.999181
}, {
	"city": "South Yarra",
	"state": "Victoria",
	"post_code": "3141",
	"lat": -37.8401,
	"lng": 144.9954
}, {
	"city": "St Kilda",
	"state": "Victoria",
	"post_code": "3182",
	"lat": -37.842632,
	"lng": 144.977707
}];

const distinctCities = require('./suburb');

async function processSuburb(category, urls, index, suburbs, callback) {
	if (suburbs.length == index) {
		return callback(urls);
	} else {
		const location = suburbs[index];
		var options = {
			method: 'POST',
			url: 'https://dev.avaana.com.au/api/service-availability',
			headers: {
				'content-type': 'application/json'
			},
			body: {
				service: category.name,
				locObj: {
					city: location.suburb,
					state: location.state,
					post_code: location.post_code,
					Loclat: location.lat,
					Loclng: location.lon
				},
				min_price: null,
				max_price: null,
				serviceTimel: null
			},
			json: true
		};
		request(options, (error, response, body) => {
			if (error) {
				processSuburb(category, urls, ++index, suburbs, callback);
			} else {
				console.log('category ', category, ' location ', location)
				if (body.search_data && body.search_data.length > 0) {
					urls.push({
						url: '/' + category.name.split(' ').join('-').toLowerCase() + '/' + location.suburb.split(' ').join('-').toLowerCase() + '/' + location.post_code,
						changefreq: 'daily',
						priority: 1
					});
				}
				processSuburb(category, urls, ++index, suburbs, callback);
			}
		});
		// const response = await new Promise((resolve, reject) => {
		// 	request(options, (error, response, body) => {
		// 		if (error) {
		// 			reject(error);
		// 		} else {
		// 			resolve(response.body);
		// 		}
		// 	});
		// });
		// console.log(location);
		// if (response.search_data && response.search_data.length > 0) {
		// 	urls.push({
		// 		url: '/' + category.name.split(' ').join('-').toLowerCase() + '/' + location.suburb.split(' ').join('-').toLowerCase() + '/' + location.post_code,
		// 		changefreq: 'daily',
		// 		priority: 1
		// 	})
		// }
		// processSuburb(category, urls, ++index, suburbs, callback);

	}
}

function processCategory(categories, urls, suburbs, index, callback) {
	if (index == categories.length) {
		return callback(urls)
	} else {
		processSuburb(categories[index], urls, 0, suburbs, function(urls) {
			processCategory(categories, urls, suburbs, ++index, callback);
		});
	}
}

app.get('/update_services_sitemap.xml', (req, res) => {
	try {
		var cities = require('./states/' + req.query.state);
		var options = {
			method: 'GET',
			url: 'https://avaana.com.au/api/a_popular_service/',
			headers: {
				'content-type': 'application/json'
			}
		};

		request(options, async(error, response, body) => {

			var urls = [];
			if (!error && cities) {
				response = JSON.parse(response.body);
				processCategory(response.Popular_Service_Data, [], cities, 0, function(urls) {
					sitemap = sm.createSitemap({
						hostname: 'https://avaana.com.au/',
						cacheTime: 600000, // 600 sec cache period
						urls: urls
					});

					fs.writeFileSync(__dirname + '/sitemap/' + req.query.state + '_services_sitemap.xml', sitemap.toString(), 'utf8');
				});
			}
			res.send(200);
		});
	} catch (e) {
		res.send(500);
	}


});

app.get('/services_sitemap.xml', (req, res) => {

	// var options = {
	// 	method: 'GET',
	// 	url: 'https://avaana.com.au/api/a_get_service_cat/',
	// 	headers: {
	// 		'content-type': 'application/json'
	// 	}
	// };


	// request(options, (error, response, body) => {

	// 	var urls = [];

	// 	if (!error) {
	// 		response = JSON.parse(response.body);
	// 		response.avaana_categories.forEach(async(category) => {
	// 			await distinctCities.forEach((location) => {
	// 				urls.push({
	// 					url: '/' + category.name.split(' ').join('-').toLowerCase() + '/' + location.city.split(' ').join('-').toLowerCase() + '/' + location.post_code,
	// 					// url: '/' + category.name.split(' ').join('-').toLowerCase() + '/' + location.suburb.split(' ').join('-').toLowerCase() + '/' + location.post_code,
	// 					changefreq: 'daily',
	// 					priority: 1
	// 				});
	// 			});
	// 		});
	// 	}
	// 	sitemap = sm.createSitemap({
	// 		hostname: 'https://avaana.com.au/',
	// 		cacheTime: 600000, // 600 sec cache period
	// 		urls: urls
	// 	});

	// 	res.header('Content-Type', 'application/xml');
	// 	res.send(sitemap.toString());
	// });
	fs.createReadStream(__dirname + '/services_sitemap.xml').pipe(res);

});

app.get('/sitemap_index.xml', (req, res) => {

	var urls = [{
		url: '/',
		changefreq: 'daily',
		priority: 1
	}, {
		url: '/plan-pricing',
		changefreq: 'daily',
		priority: 1
	}, 
	//{
	//	url: '/register',
	//	changefreq: 'daily',
	//	priority: 1
	//},
	 {
		url: '/services_sitemap.xml',
		changefreq: 'daily',
		priority: 1
	}, {
		url: '/providers_sitemap.xml',
		changefreq: 'daily',
		priority: 1
	}];

	sitemap = sm.createSitemap({
		hostname: 'https://avaana.com.au/',
		cacheTime: 600000, // 600 sec cache period
		urls: urls
	});

	sitemap.add({
		name: 'robots',
		content: 'not-index'
	});

	res.header('Content-Type', 'application/xml');
	res.send(sitemap.toString());

});



app.get('/providers_sitemap.xml', (req, res) => {
	var urls = [];

	var options = {
		method: 'GET',
		url: 'https://avaana.com.au/api/all-business-list',
		headers: {
			'content-type': 'application/json',
		},
		json: true
	};

	request(options, (error, response, body) => {

		if (!error) {
			response = response.body;
			response.data.forEach((business) => {
				business.business_location.map((location) => {
					urls.push({
						url: '/' + business.slug + '/' + location.city.split(' ').join('-').toLowerCase(),
						changefreq: 'daily',
						priority: 1
					});
				});
			});
		}

		sitemap = sm.createSitemap({
			hostname: 'https://avaana.com.au/',
			cacheTime: 600000, // 600 sec cache period
			urls: urls
		});

		res.header('Content-Type', 'application/xml');
		res.send(sitemap.toString());
	});

});

app.get('/robots.txt', (req, res) => {
	res.sendFile(__dirname + '/robots.txt');
});

app.use('/sitemap', express.static('sitemap'));

app.listen(3000, () => {
	console.log('server is listening on 3000');
});
