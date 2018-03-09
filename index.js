//jshint esversion:6

const fs = require('fs');
const ytdl = require('ytdl-core');

const ffmpeg = require('fluent-ffmpeg');
const moment = require('moment');

const cliProgress = require('cli-progress');
const colors = require('colors');

const Enquirer = require('enquirer');
const enquirer = new Enquirer();

enquirer.register('confirm', require('prompt-confirm'));

// vars
let ytTime, percentage, dirname = 'mp3s/';

// question asked to console
const question = [
	{
		type: 'input',
		name: 'ytURL',
		message: 'Paste in youtube link',
	}
];

enquirer.ask(question)
.then(function(answer) {

	// get information about YT video and get video time
	ytdl.getInfo(answer.ytURL, (err, info) => {
		if (err) throw err;
		ytTime = info.length_seconds;
		startConversion(answer.ytURL, info.title, info.author.name);
	});

});

const startConversion = (url, title, artist) => {

	// progress bar
	const consoleBar = new cliProgress.Bar({
		format: 'Conversion Progress |' + colors.red('{bar}') + '| {percentage}%',
		barCompleteChar: '\u2588',
		barIncompleteChar: '\u2591',
		hideCursor: true
	});

	// set the bar to equal seconds time of youtube video input
	consoleBar.start(ytTime, 0);
	
	// pass in the youtube stream from ytdl 
	let stream = ytdl(url, { filter: (format) => format.container === 'mp4' });

	// start ffmpeg
	let ff = new ffmpeg({source: stream});

	// create conversion directory or ignore if exists
	if(!fs.existsSync(dirname)){
		fs.mkdirSync(dirname);
	}

	// convert mp4 to mp3 save to dir
	ff.withAudioCodec('libmp3lame')
		.toFormat('mp3')
		.output(dirname + artist + ' ' +title + '.mp3')
		.run();

	// update the progress bar
	ff.on('progress', (progress) => {
		consoleBar.update(Math.round(moment.duration(progress.timemark).asSeconds()));
	});
	
	// stop progress bar and console.log completed
	ff.on('end', () => {
		consoleBar.stop();
		console.log("Conversion Complete");
	});
	

};

