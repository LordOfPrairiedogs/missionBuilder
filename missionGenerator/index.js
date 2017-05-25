
'use strict';

var fs = require('fs');
var request = require('request');
var mgData;

function MissionGenerator() {
    mgData = this;
    mgData.regexBracket = /(\[[\w|_|\s\.\%\<\>]+\])/;
    mgData.masterDictionary = {};
    mgData.deltaDictionary = {};
    mgData.usage = {};
    mgData.loadState = null;
}

function encodeQueryData(data) {
    var ret = [];
    for (var d in data)
        ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
    return ret.join('&');
}

module.exports = MissionGenerator;

MissionGenerator.prototype.addDictionary = function(dictionaryData){
    mgData.masterDictionary = dictionaryData;
};
MissionGenerator.prototype.saveDictionary = function(filename, saveAll){
    var saveDictionary;
    if (saveAll){
        saveDictionary = mgData.masterDictionary;
    } else {
        saveDictionary = mgData.deltaDictionary;
    }
    var dictionaryText = JSON.stringify(saveDictionary);
    fs.writeFile(filename, dictionaryText, function (err) {
        if (err) return console.log(err);
    });
};
MissionGenerator.prototype.newDictionary = function(filename){
    mgData.loadState = null;
    var data = require(filename);
    mgData.masterDictionary=data;
    mgData.loadState = 'ready';
};
MissionGenerator.prototype.loadDictionary = function(filename){
    var data = require(filename);
    if (mgData.masterDictionary){
        mgData.loadState = null;
        for (var groupName in data){
            mgData.addToGroup(groupName, data[groupName]);
        }
        mgData.loadState = 'ready';
    } else {
        mgData.newDictionary(filename);
    }
}

MissionGenerator.prototype.resolveGroup = function(groupName){
    var phrase;
    var returnVal = "";
    console.log("resolveGroups processing groupName: " + groupName);
    var groupList = mgData.masterDictionary[groupName];
    if (!groupList){
        phrase = groupName;
    } else {
        var wd = mgData.buildWeightedDictionary(groupList);
        phrase = mgData.weighted_choice(wd);
    }

    if (mgData.regexBracket.test(phrase)){
        console.log("resolveGroups determined more resolution...");
        returnVal = mgData.run(phrase);
    } else {
        returnVal = phrase;
    }
    console.log("resolveGroups returns: " + returnVal);
    return returnVal;
};

MissionGenerator.prototype.buildWeightedDictionary = function(list){
    var regexGators = /\<(.*)\>/;
    var choices = [];
    var weight;
    for (var i = 0; i < list.length; i++) {
        var entry = list[i];
        var weightGator = regexGators.exec(entry);
        if (weightGator){
            weight = parseInt(weightGator[1]);
            entry = entry.slice(weightGator[1].length+2);
        }else{
            weight = 1;
        }
        choices.push({key:entry,value:weight});
    }
    return choices
};

MissionGenerator.prototype.weighted_choice = function (choices) {
    //find the sum of choices
    var total = 0;
    for (var i = 0; i < choices.length; i++) {
        total += choices[i].value;
    }
    //create a random number between 1 and the sum of weights
    var r = Math.floor((Math.random() * total) + 1);
    //now get the first one where wieght + total > random number
    var upto = 0;
    for (i = 0; i < choices.length; i++){
        upto += choices[i].value;
        if (r  <= upto){
            return choices[i].key;
        }
    }
}

MissionGenerator.prototype.addToGroup = function (groupName, phrases, addToDelta){
    groupName = groupName.toUpperCase();
    var groupList = mgData.masterDictionary[groupName];
    if (!Array.isArray(phrases)){
        phrases = [phrases];
    }
    if (groupList){
        mgData.masterDictionary[groupName]=groupList.concat(phrases);
    }else{
        mgData.masterDictionary[groupName] = phrases;
    }
    groupList = mgData.deltaDictionary;
    if (groupList && addToDelta){
        mgData.deltaDictionary[groupName]=groupList.concat(phrases);
    }else{
        mgData.deltaDictionary[groupName] = phrases;
    }
}

MissionGenerator.prototype.resetUsage = function (phrase){
    delete mgData.usage[phrase];
}

MissionGenerator.prototype.resolveName = function (groupName) {
    var nameOptions = groupName.slice(6).split(".");
    var data = {"inc": "gender,name,nat", "noinfo": "true"};
    for (var x = 0; x < nameOptions.length; x++) {
        var section = nameOptions[x];
        if (section.startsWith("nat")) {
            //countryCode
            data['nat'] = section.slice(3);
        } else if (section.startsWith("gender")) {
            data['gender'] = section.slice(6);
        }
    }

    var querystring = encodeQueryData(data);
    var url = 'https://randomuser.me/api/?' + querystring;
    return url;



}

MissionGenerator.prototype.run = function (phrase, ctr){
    if (!ctr){
        ctr = 1;
    }


    if (mgData.loadState == 'ready'){
        console.log("run phrase is: " + phrase);
        phrase = phrase.replace(mgData.regexBracket, function(m){
            var groupNameTop = m.replace('[', '').replace(']', '');
            var groupNames = groupNameTop.split('|');
            var groupwd = mgData.buildWeightedDictionary(groupNames);
            var groupNameIn = mgData.weighted_choice(groupwd);
            var groupName = groupNameIn.toUpperCase();

            if (groupName.startsWith('%')){
                groupName = groupName.replace('%','');

                if(mgData.usage[groupName]){
                    phrase = mgData.usage[groupName];
                } else {
                    phrase = mgData.run(m.replace('%',''));
                    mgData.usage[groupName] = phrase;
                }
            }

            if (groupName.startsWith('DICE.')) {
                var dice = groupName.slice(5).split('D');
                var sum = 0;
                for (var i = 0; i < dice[0]; i++) {
                    sum += Math.floor((Math.random() * dice[1]) + 1);
                }
                return phrase = sum.toString();

            } else if (groupName.startsWith('NAME.')) {
                var url = mgData.resolveName(groupName);
                request(url, function (error, response, body) {
                    var results = JSON.parse(body)['results'];
                    var first = results[0];
                    var name = first.name;
                    var phrase = name.first + " " + name.last;
                    console.log(phrase);
                    return phrase;
                });

            } else {
                return mgData.resolveGroup(groupName);
            }
        });
        console.log("after resolving, phrase is: " + phrase);
        if (mgData.regexBracket.test(phrase)){
            console.log("run determined more resolution...");
            phrase = mgData.run(phrase);
        }

    } else if (ctr<10){
        ctr++;
        setTimeout(function(){mgData.run(phrase,ctr)}, 3000);
    }

    return phrase;
};
