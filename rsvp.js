Events = new Mongo.Collection('events');

if (Meteor.isClient) {

	Template.home.onRendered(function(){
		$(".share").html("");
	});

  	Template.home.events({
  		'click #createEvent': function(event){
  			event.preventDefault();

  			var eventId = ShortId.generate();

  			Meteor.call('createEvent', eventId);

  			var eventURL = Iron.controller()['url'] + eventId ;

  			$("#eventURL").val(eventURL);
  			$("#eventURL").select();
  			$(".share").html("Share this link");
  		},

  		'click #eventURL': function(event){
  			event.preventDefault();
  			$(event.target).select();
  		}
  	});

  	Template.eventPage.onCreated(function(){
  		var eventId = window.location.pathname;
  		eventId = eventId.slice(1);
  		Meteor.call('attendees', eventId);
  	});

  	Template.eventPage.onRendered(function(){
  		var eventId = window.location.pathname;
  		eventId = eventId.slice(1);
  		Meteor.call('attendeeCount', eventId);
  	});

  	Template.eventPage.events({
  		'click #notAttending': function(event){
  			event.preventDefault();
  			var eventId = this._id;
  			Meteor.call('deleteAttendee', this._id, function(err){
  				if(err){
  					alert("something wrong happened");
  				} else {
  					Meteor.call('updateCount', eventId);
  				}
  			});
  		}
  	});
}

if (Meteor.isServer) {
  	Meteor.publish('events', function(eventId){
  		return Events.find({_id:eventId});
  	});

  	Meteor.methods({
  		'createEvent': function(eventId){
  			Events.insert({
  				_id: eventId,
  				attendees: [],
  				count: 0
  			});
  		},

  		'attendees' : function(eventId){
  			var conn = this.connection.clientAddress;
  			Events.update({_id:eventId},{$addToSet:{attendees:conn}});
  		},

  		'attendeeCount': function(eventId){
  			var eve = Events.findOne({_id:eventId});
  			Events.update({_id:eventId},{$set:{count: eve.attendees.length}});
  		},

  		'deleteAttendee': function(eventId){
  			
  			var conn = this.connection.clientAddress;
  			Events.update({_id:eventId}, {$pull:{attendees:conn}});
  		},

  		'updateCount': function(eventId){
  			var eve = Events.findOne({_id:eventId});
  			Events.update({_id:eventId},{$set:{count: eve.attendees.length}});
  		}
  	})
}

// Router configuration

Router.configure({
	layoutTemplate: 'main'
});

Router.route('/', {
	name: 'home',

	action: function(){
		this.render('home');
	}
});


Router.route('/:_id', {
	name: 'eventPage',

	loadingTemplate: 'loading',

	waitOn: function(){
		return Meteor.subscribe('events', this.params._id);
	},

	action: function(){
		this.render('eventPage');
	},

	data: function(){
		return Events.findOne({_id: this.params._id});
	}
});
