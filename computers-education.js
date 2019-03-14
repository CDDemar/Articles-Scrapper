//browse all the journals urls
const rp = require('request-promise');
const $ = require('cheerio');
const fs = require('fs');
const jsonexport = require('jsonexport');
//const dotenv = require('dotenv')

const domain = '';
const library = '';

/* Random millisencods generator */
const rng = (min, max) => {
	return 1000 * Math.ceil(Math.random() * (max - min) + min);
};

/* Obtain all the months with published articles href */
const loadMonths = () => {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			rp(domain + library)
				.then((html) => {
					let months_hrefs = [];
					$('#content p a', html).each((i, el) => {
						if (i >= 2) months_hrefs.push(el.attribs.href);
					});
					resolve(months_hrefs);
				})
				.catch((library_err) => {
					reject(library_err);
				});
		}, rng(1, 2));
	});
};

/* Obtain all published articles href within a month */
const loadMonthArticles = (month) => {
	return new Promise((resolve, reject) => {
		let month_articles = [];
		setTimeout(() => {
			rp(domain + month)
				.then((month_html) => {
					$('p.title a', month_html).each((i, month_el) => {
						month_articles.push(month_el.attribs.href);
					});
					resolve(month_articles);
				})
				.catch((month_err) => {
					reject(month_err);
				});
		}, rng(1, 2));
	});
};

/* Query article */
const queryArticle = (article) => {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			rp(domain + article)
				.then((article_html) => {
					let contents = $('#content', article_html).text().toString().toLowerCase().trim();
					let title = $('p.title', article_html).text();
					let authors = [];
					if ($($('span.caption', article_html)[0]).text() === 'Author:') {
						authors = $($('span.caption', article_html)[0]).parent().text().split(':')[1];
					} else if ($($('span.caption', article_html)[0]).text() === 'Authors:') {
						authors = $($('span.caption', article_html)[0]).parent().text().split(':')[1].split(',');
					} else {
						authors = [
							'###'
						];
					}
					let abstract = $($('span.caption', article_html)[1]).parent().text().split(':')[1];
					let date = $('p.smaller h2', article_html).text().split(',')[2];
					let URL = domain + article;
					let DOI = $($('span.caption', article_html)[4]).parent().text().split(':')[1];
					//let PDF = $('p.pdf a').attribs.href;
					let res = undefined;
					if (searchKeywords(contents)) {
						res = {
							title    : title,
							authors  : authors,
							abstract : abstract,
							date     : date,
							URL      : URL,
							DOI      : DOI
						};
					}
					resolve(res);
				})
				.catch((article_err) => {
					reject(article_err);
				});
		}, rng(1, 2));
	});
};

//list of search term for the research
const searchKeywords = (text) => {
	if (
		text.includes('mixed method') ||
		text.includes('metodo mixto') ||
		text.includes('método mixto') ||
		text.includes('multiple method') ||
		text.includes('metodo multiple') ||
		text.includes('método multiple') ||
		text.includes('multi method') ||
		text.includes('multi metodo') ||
		text.includes('multi método') ||
		text.includes('multimethod') ||
		text.includes('multimetodo') ||
		text.includes('multimétodo') ||
		text.includes('multiple research method') ||
		text.includes('investigacion de metodo multiple') ||
		text.includes('investigación de método múltiple') ||
		text.includes('mixed research') ||
		text.includes('investigacion mixta') ||
		text.includes('investigación mixta') ||
		(text.includes('quali') && text.includes('quanti') && text.includes('combin')) ||
		(text.includes('quali') && text.includes('quanti') && text.includes('integra')) ||
		(text.includes('quali') && text.includes('quanti') && text.includes('mix'))
	)
		return true;
	else return false;
};

console.log('STARTING SCRAPPER ON ' + domain + library + '...');
console.log('OBTAINING MONTHS...');
loadMonths()
	.then(async (months_hrefs) => {
		let articles_hrefs = [];
		console.log('OBTAINING ARTICLES...');
		for (let month of months_hrefs) {
			try {
				let month_articles_res = await loadMonthArticles(month);
				if (month_articles_res.lenght <= 0) {
					continue;
				} else {
					// Append each article to the articles list
					for (let month_article of month_articles_res) {
						articles_hrefs.push(month_article);
					}
				}
				console.log('\tLOADED: ' + articles_hrefs.length);
			} catch (error) {
				console.log('MONTH ERR: ' + error);
			}
		}
		// Query each article
		let success = [];
		console.log('QUERYING ARTICLES...');
		for (let article of articles_hrefs) {
			try {
				let article_res = await queryArticle(article);
				if (article_res != undefined) {
					success.push(article_res);
					console.log('\t\tURL: ' + article_res.URL);
				}
				console.log('\tMATCHES ' + success.length + '...');
			} catch (error) {
				console.log('ARTICLE ERR: ' + error);
			}
		}
	})
	.catch((library_err) => {
		console.log('ERR: ' + library_err);
	});
