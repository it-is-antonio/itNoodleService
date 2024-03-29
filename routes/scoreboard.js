var express = require('express');
var router = express.Router();
var itnoodle = require('../project_modules/itnoodle.js');
var pageSize = 1000;
router.get('/', (req, res) => {
	console.log("call scoreboard api");
	let page = parseInt(req.query.page) || 1;
	let term = req.query.term || 1;
	let year = req.query.year;
	let type_edu = parseInt(req.query.type_edu) || 0;
	page = Math.max(1, page);
	let scoreboards = {page: page};
	itnoodle
	.scoreboardCol
	.find({term: term, year: year, type_edu: type_edu})
	.skip(pageSize*(page-1))
	.limit(pageSize)
	.sort({"course.uploadtime": -1})
	.toArray((err, sbs) => {
		let d;
		if(!err) {
			scoreboards.content = [];
			sbs.forEach((sb) => {
				d = new Date(sb.course.uploadtime.getTime() + 7*60*60*1000);
				scoreboards.content.push({
					term_name: sb.term_name,
					year_name: sb.year_name,
					term: term,
					year: year,
					type_edu: type_edu,
					code: [sb.course.code.slice(0,7), sb.course.code.slice(7)==""?"1":sb.course.code.slice(7)].join("-").toUpperCase(),
					name: sb.course.name,
					public_src: sb.course.src,
					uploadtime: [[d.getHours(), d.getMinutes()].join(':'), [("0"+d.getDate()).slice(-2), ("0"+(d.getMonth()+1)).slice(-2), d.getFullYear()].join('-')].join(" ")
				});
			})
			res.json(scoreboards);
		}
	});
})
router.post('/star', (req, res) => {
	console.log("call scoreboard api STAR");
	// TODO validate session
	let session = req.body.session;
	let content = JSON.parse(req.body.content);
	let stars = {};
	if(content.public_src)
		stars[Buffer.from(content.public_src).toString("base64")] = content;
	// console.log(stars);
	itnoodle.favScoreboardCol.findOne({session: session}).then((favScore) => {
		// console.log(favScore);
		if(favScore) {
			Object.keys(stars).forEach((p_src) => {
				favScore.stars[p_src] = stars[p_src];
			})
			itnoodle.favScoreboardCol.updateOne({session: session}, {$set: {stars: favScore.stars}}, (err, result) => {
				if(!err) {
					delete favScore._id;
					res.json(favScore);
				}		
				else {
					console.log(err);
					res.sendStatus(400);
				}
			});
		}
		else
			itnoodle.favScoreboardCol.insert({session: session, stars: stars}, (err, result) => {
				if(!err) {
					res.json({session: session, stars: stars});
				}
				else {
					console.log(err);
					res.sendStatus(400);
				}
			})
	});
})
router.delete('/unstar', (req, res) => {
	console.log("call scoreboard api UNSTAR");
	// TODO validate session
	let session = req.body.session;
	let content = JSON.parse(req.body.content);
	console.log(content);
	let stars = {};
	if(content.public_src)
		stars[Buffer.from(content.public_src).toString("base64")] = 1;
	itnoodle.favScoreboardCol.findOne({session: session}).then((favScore) => {
		if(favScore) {
			Object.keys(stars).forEach((p_src) => {
				delete favScore.stars[p_src];
			})
			itnoodle.favScoreboardCol.updateOne({session: session}, {$set: {stars: favScore.stars}}, (err, result) => {
				if(!err) {
					delete favScore._id;
					res.json(favScore);	
				}
				else {
					console.log(err);
					res.sendStatus(400);
				}
			});
		}
	});
})
router.get('/favorite', (req, res) => {
	console.log("call scoreboard api FAVORITE");
	// equal post /star with empty content
})
module.exports = router;