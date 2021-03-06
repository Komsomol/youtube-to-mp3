//jshint esversion:6

const fs = require('fs');
const ytdl = require('ytdl-core');

const ffmpeg = require('fluent-ffmpeg');
const moment = require('moment');

const cliProgress = require('cli-progress');
const colors = require('colors');

const { prompt } = require('enquirer');

//vars
let ytTime, percentage, dirname = 'mp3s/';

async function getYTURL(){
	// get user prompt
	const question = await prompt({
		type: 'input',
		name: 'ytURL',
		message: 'Paste in youtube link',
	});

	// check if url is a valid Youtube link
	if (validateYouTubeUrl(question.ytURL)){ 
		// execute this when result is recieved
		ytdl.getInfo(question.ytURL, (err, info) => {
			if (err) {
				throw err;
			}
			ytTime = info.length_seconds;
			startConversion(question.ytURL, info.title, info.author.name);
		});
	} else {
		console.log("Input a valid YT url");
		process.exit(0)
	}

}

// conversion process
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

const validateYouTubeUrl = (url) => {
	if (url != undefined || url != '') {
		var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/;
		var match = url.match(regExp);
		if (match && match[2].length == 11) {
			// Do anything for being valid
			// if need to change the url to embed url then use below line
			return true
		}
		else {
			// Do anything for not being valid
			return false
		}
	}
}


// start
getYTURL();