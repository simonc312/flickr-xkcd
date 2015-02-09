var THEME = require('themes/flat/theme');
var BUTTONS = require('controls/buttons');
var TRANSITIONS = require('transitions');

var base_url = "https://xkcd.com/";
var json_url = "info.0.json";
var XKCD_URL = base_url + json_url;
var flickrServiceURL = "https://api.flickr.com/services/feeds/photos_public.gne?";
var lastComicNumber;

var blackS = new Skin({fill:"black"});

var headerStyle = new Style( {font: "bold 50px", horizontal: 'right', vertical: 'middle', color:"white" } );
var labelStyle = new Style( {font: "bold 40px", horizontal: 'left', vertical: 'middle', color:"white" } );
var buttonLabelStyle = new Style({font:"bold 30px", color:"white"});

var buttonBehavior = function(content, data){
	BUTTONS.ButtonBehavior.call(this, content, data);
}

buttonBehavior.prototype = Object.create(BUTTONS.ButtonBehavior.prototype, {
	onTap: { value: function(button){
		//flickr.empty(0);
		var comicNumber = comic.behavior.comicNumber;
		trace("inside button tap");
		if(comicNumber){	
			var buttonString = button.first.string;
			if(buttonString === "prev"){
				comicNumber = Math.max(0, comicNumber - 1);
				comic.behavior.direction = "right";
			}
			else if(buttonString === "next"){
				comicNumber = Math.min(lastComicNumber, comicNumber + 1);
				comic.behavior.direction = "left";
			}
			else if(buttonString === "random"){
				comicNumber = ~~(Math.random() * lastComicNumber) + 1;
				comic.behavior.direction = "up";
			}
				
			var message = new Message(base_url + comicNumber + "/" + json_url);
			comic.invoke(message,Message.JSON);
		}
	}}
});

var myButtonTemplate = BUTTONS.Button.template(function($){ return{
	height:30, width: 60, top:240, bottom:10, left:4, right:4,
	contents:[
		new Label({skin: new Skin({fill: "grey"}), left:0, right:0, height:30, width: 20, string:$.textForLabel, style: buttonLabelStyle})
	],
	behavior: new buttonBehavior
}});

var myPictureTemplate = Container.template(function($){ return{
	top:0, bottom:0, left:0,right:0,
	contents: [
		new Picture({top:40,bottom:0,skin: new Skin({borders:{top:4,bottom:4,left:4,right:4},stroke: 'white'}), url: $.name, 
			behavior: Object.create(Picture.prototype,{ 
				onLoaded: {value: function(picture){
					comic.run( new TRANSITIONS.Push(), comicPicture, picture.container,{easetype:"quadEaseInOut",duration:300,direction:comic.behavior.direction});
					var json = comic.behavior.json;
					comic.behavior.updateComic(json.num,picture.container,json.title);
				}}
			})
		})
	]
	
}});
var headerLabel = new Label({height:60,top:10,right:0,left:0,name: "header",style: headerStyle,string:"flickr + xkcd = "});
var titleLabel = new Label({height:60,top:10,left:0,right:0,name: "title",style: labelStyle,string:""});
var comicPicture = new myPictureTemplate({name:""});
var flickrPicture = new Picture({top:0});


var flickr = new Column({width:600, height:400,top:0,bottom:0,left:0,right:0,
contents: [				
				flickrPicture
			],
	behavior: {
		onCreate: function(container, data){
			this.data = data;
			this.updateImage = function(picture,url){
				picture.url = url;
				trace('inside updateImage flickr \n');
			}
		},
		onComplete: function(container,message,json){
			if(json){
				flickr.empty(0);
				trace('inside onComplete flickr \n');
				var items = json.items;
				if(items.length > 0){
					var line = new Line();
					var rowCount = 5;
					var effect = new Effect();
					effect.gaussianBlur(1,1);
					effect.gray('dark');
					for(index in items){
						var tmp = new Picture({opacity:0.8,left:4, top:4});
						tmp.effect = effect;
						var randSize = Math.random() > 0.5 ? "q.jpg" : "s.jpg";
						this.updateImage(tmp,items[index].media.m.replace("m.jpg",randSize));
						line.add(tmp);
						if( (index+1) % rowCount == 0){ 
							container.add(line);
							line = new Line();
						}
					}	
				}
			}
		}
	}
});


var comic = new Column({width:400, height:400,top:10,bottom:0,left:0,right:0,
contents: [				
				comicPicture
			],
	behavior: {
		onCreate: function(container, data){
			this.data = data;
			this.comicNumber;
			this.direction = "up";
			this.setComicNumber = function(comicNumber){ this.comicNumber = comicNumber}
			this.updateComic = function(comicNumber,newPicture,title){
				titleLabel.string = title;
				comicPicture = newPicture;
				this.setComicNumber(comicNumber);
			}
			var message = new Message(XKCD_URL);
			container.invoke(message,Message.JSON);
			//add loading message;
			trace('inside onCreate comic \n');
		},
		onComplete: function(container,message,json){
			if(json){
				if(!lastComicNumber)
					lastComicNumber = json.num;
				var newPicture = new myPictureTemplate({name:json.img});
				var randomPanda = Math.random() > 0.8 ? "" : "panda";
				if(randomPanda === "panda")
					json.title += " + pandas";
				this.json = json;
				trace('inside onComplete comic \n');
				
				var flickr_url = flickrServiceURL + serializeQuery({
								format: "json",
								tagmode: "any",
								nojsoncallback: 2,
								tags: json.title.split(" ")
							});
				trace(flickr_url + "\n");
				var flickr_message = new Message( flickr_url );
				flickr.invoke(flickr_message,Message.JSON);
			}
		}
	}
});

var prevButton = new myButtonTemplate({name:"prevButton",textForLabel:"prev"});
var randomButton = new myButtonTemplate({name:"randomButton",textForLabel:"random"});
var nextButton = new myButtonTemplate({name:"nextButton",textForLabel:"next"});

var main = new Column({
	left:0, right:0, top:0, bottom:0,
	skin: blackS,
	contents:[
		new Line({left: 0, right:0, top:0, bottom:0, name: "titleLine",
			contents:[
				headerLabel,titleLabel
			]}),
		new Line({left: 0, right:0, top:0, bottom:0,name: "comicLine",
			contents:[
				new Scroller({left:0,right:0,contents:[flickr, comic], 
					behavior: {
					onCreated: function(container,data){
						this.container = container;
						this.data = data;
					},
					onScrolled: function(scroller){
					//do something
					}
				}})
			]}),
		new Line({left: 0, right:0, top:0, bottom:0, name: "buttonLine",
			contents:[
				prevButton, randomButton, nextButton 
			]})
	]
});

application.add(main);

