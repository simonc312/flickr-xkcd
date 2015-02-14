var THEME = require('themes/flat/theme');
var BUTTONS = require('controls/buttons');
var TRANSITIONS = require('transitions');
var SCROLLER = require('mobile/scroller');
var SLIDERS = require('controls/sliders');
var base_url = "https://xkcd.com/";
var json_url = "info.0.json";
var XKCD_URL = base_url + json_url;
var flickrServiceURL = "https://api.flickr.com/services/feeds/photos_public.gne?";
var lastComicNumber;

var rightArrowSkin = new Skin({
	width: 128,
	height: 128,
	texture: new Texture('right-arrow.png')
});
var leftArrowSkin = new Skin({
	width: 128,
	height: 128,
	texture: new Texture('left-arrow.png')
});
var randomSkin = new Skin({
	width: 128,
	height: 128,
	texture: new Texture('question-mark.png')
});
var refreshSkin = new Skin({
	width: 128,
	height: 128,
	texture: new Texture('refresh.png')
});
var transparentSkin = new Skin("#7f000000");
var alphaBlue = new Skin("#7f0000ff");
var blackS = new Skin({fill:"black"});
var headerStyle = new Style( {font: "bold 50px", horizontal: 'right', vertical: 'middle', color:"white" } );
var labelStyle = new Style( {font: "bold 40px", horizontal: 'left', vertical: 'middle', color:"white" } );
var buttonLabelStyle = new Style({font:"bold 30px", color:"white"});

var buttonBehavior = function(content, data){
	BUTTONS.ButtonBehavior.call(this, content, data);
}

buttonBehavior.prototype = Object.create(BUTTONS.ButtonBehavior.prototype, {
	onTap: { value: function(button){
		var buttonString = button.first.string;
		var comicNumber = comic.behavior.comicNumber;
		if(buttonString === "refresh"){
				
				comic.behavior.invokePrevMessage();
				return;
		}
		trace("inside button tap");
		if(comicNumber){	
			
			if(buttonString === "prev"){
				comicNumber = Math.max(0, comicNumber - 1);
				comic.behavior.direction = "right";
			}
			else if(buttonString === "next"){
				if(lastComicNumber === comicNumber)
					return;
				comicNumber = Math.min(lastComicNumber, comicNumber + 1);
				comic.behavior.direction = "left";
			}
			else if(buttonString === "random"){
				comicNumber = ~~(Math.random() * lastComicNumber) + 1;
				comic.behavior.direction = "down";
			}
				
			var message = new Message(base_url + comicNumber + "/" + json_url);
			comic.behavior.prevMessage = message;
			comic.invoke(message,Message.JSON);
		}
	}}
});

var myButtonTemplate = BUTTONS.Button.template(function($){ return{
	height:30, width: 60, top:10, bottom:10, left:4, right:4, skin: $.skin,
	contents:[
		new Label({skin: new Skin({fill: "grey"}), left:0, right:0, height:30, width: 20, string:$.textForLabel, style: buttonLabelStyle})
	],
	behavior: new buttonBehavior
}});

var myPictureTemplate = Container.template(function($){ return{
	top:0, bottom:0, left:0,right:0,
	contents: [
		new Picture({top:40, url: $.name, 
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
				flickr.behavior.reset = false;
				trace('inside onComplete flickr \n');
				var items = json.items;
				if(items.length > 0){
					var line = new Line();
					var rowCount = 5;
					var effect = new Effect();
					effect.gaussianBlur(1,1);
					effect.gray('dark');
					for(index in items){
						var tmp = new Picture({opacity:0.8,right:10, top:10});
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
		trace('inside onCreate comic \n');
			this.data = data;
			this.comicNumber;
			this.json; //store json data to use onLoaded event for PictureTemplate
			this.prevMessage; //store previous message on failure
			this.reset = false;
			this.direction = "down";
			this.setComicNumber = function(comicNumber){ this.comicNumber = comicNumber}
			this.updateComic = function(comicNumber,newPicture,title){
				titleLabel.string = title;
				comicPicture = newPicture;
				this.setComicNumber(comicNumber);
			}
			this.displayError = function(){
				this.json = {title: 'No Internet Connection',num: false};
				randomButton.first.string = "refresh";
				randomButton.skin = refreshSkin;
				nextButton.skin = transparentSkin;
				prevButton.skin = transparentSkin;
				prevButton.first.string = "";
				nextButton.first.string = "";
				var error = new myPictureTemplate({name:"error.png"});
			}
			this.invokePrevMessage = function(){
				trace('here');
				comic.invoke(this.prevMessage,Message.JSON);
			}
			this.restoreButtons = function(){
				trace('restore buttons');
				randomButton.first.string = "random";
				randomButton.skin = randomSkin;
				prevButton.first.string = "prev";
				prevButton.skin = leftArrowSkin;
				nextButton.first.string = "next";
				nextButton.skin = rightArrowSkin;
				
				
				
			}
			var message = new Message(XKCD_URL);
			this.prevMessage = message;
			container.invoke(message,Message.JSON);
			
		},
		onComplete: function(container,message,json){
			if(message.error != 0){
				this.displayError();
				return;
			}
			else if(json){
				trace('inside onComplete comic \n');
				this.restoreButtons();
				if(!lastComicNumber)
					lastComicNumber = json.num;
				
				var randomPanda = Math.random() > 0.95 ?  "panda" : "";
				if(randomPanda === "panda")
					json.title += " + pandas";
				this.json = json;
				
				var newPicture = new myPictureTemplate({name:json.img});
				
			
				
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

var scroller = SCROLLER.VerticalScroller.template(function($){ return{
    top: 0, bottom:10, contents: $.content, clip:true,behavior: Object.create(SCROLLER.VerticalScrollerBehavior.prototype) 
}});
var scroller2 = SCROLLER.HorizontalScroller.template(function($){ return{
    top: 0, bottom:50, contents: $.content, clip:true
}});

var comicScroller = new scroller({content:[comic]});
var contentScroller = new scroller2({content:[flickr,comicScroller]})
var prevButton = new myButtonTemplate({skin: leftArrowSkin,name:"prevButton",textForLabel:"prev"});
var randomButton = new myButtonTemplate({skin: randomSkin, name:"randomButton",textForLabel:"random"});
var nextButton = new myButtonTemplate({skin: rightArrowSkin, name:"nextButton",textForLabel:"next"});

var mySlider = SLIDERS.VerticalSlider.template(function($){ return{
	height:160, top:200, left:50, bottom:200,
	behavior: Object.create(SLIDERS.VerticalSliderBehavior.prototype, {
	 onCreate: { value : function(container, data) {
            this.data = data;
            var self = this;
            this.initialState = true;
            this.prevValue = 0;
            this.setMin = function(newMin){self.data.min = newMin};
            this.setMax = function(newMax){self.data.max = newMax};
        }},
		onValueChanged: { value: function(slider){
			SLIDERS.VerticalSliderBehavior.prototype.onValueChanged.call(this, slider);
			var newValue = Number(this.data.value);
			trace(newValue.toString() + "\n");
			if(this.prevValue <= newValue){
				comicScroller.scrollTo(comicScroller,5);
				}
			else{
				comicScroller.scrollTo(comicScroller,-5);
				trace('inside else');
				}
			this.prevValue = newValue;
	}}})
}});

//var slider = new mySlider({min:0,max:200,value:0});

var main = new Column({
	left:0, right:0, top:0, bottom:0,
	skin: blackS,
	contents:[
		new Line({left: 0, right:0, top:0, bottom:0, name: "titleLine",
			contents:[
				headerLabel,titleLabel
			]}),
		new Line({left: 0, right:0, top:20, bottom:0,name: "comicLine",
			contents:[
				contentScroller
				 
			]}),
		new Line({height: 180, width:200,right:100, left: 100, top:0, bottom:60, name: "buttonLine",
					contents:[
						prevButton, randomButton, nextButton 
					]})
			
		
	]
});

application.add(main);

