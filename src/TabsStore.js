/*
  Copyright (C) 2015  Aliaksandr Aliashkevich
  
      This program is free software: you can redistribute it and/or modify
      it under the terms of the GNU General Public License as published by
      the Free Software Foundation, either version 3 of the License, or
      (at your option) any later version.
  
      This program is distributed in the hope that it will be useful,
      but WITHOUT ANY WARRANTY; without even the implied warranty of
      MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
      GNU General Public License for more details.
  
      You should have received a copy of the GNU General Public License
      along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var MicroEvent = require('microevent');
var Config = require('./Config');

var Sequence = function(start){
    this.curval = start;
    this.nextval = function(){
        this.curval++;
        return this.curval;
    }
}

var TabSequence = new Sequence(0);

var Tab = function(id, connstr){
    this.id = id;
    this.connstr = connstr;
    this.password = password;
    this.result = null;
    this.error = null;
    this.filename = null;
    this.searchValue = '';
    this.searchVisible = false;
    this.objectInfo = null;
    this.historyItem = 0;
    this.newVersion = null;
    this.tmpScript = null;

    this.getTitle = function(){
        if (this.filename != null){
            var ret = this.filename;
        } else {
            if (typeof(this.connstr) != 'undefined' && this.connstr != null) {

                    if (this.connstr.indexOf('---') != -1){ // show alias
                        var ret = '[ '+this.connstr.match(/---\s*(.*)/)[1]+' ]';
                    } else {
                        if (this.connstr.length > 30){ // cut too long connstr
                            var ret = '[...'+this.connstr.substr(this.connstr.length-20)+' ]';
                        } else {
                            var ret = '[ '+this.connstr+' ]';
                        }
                    }
            } else {
                return '';
            }
        }
        return ret;
    }
};

var _TabsStore = function(){
    
    this.theme = (Config.getTheme() || 'dark');
    this.mode = (Config.getMode() || 'classic');
    this.tabs = {};
    this.fontSize = (Config.getFontSize() || 'medium');
    this.order = [];
    this.selectedTab = 0;
    this.renderer = 'plain'; // plain or auto

    this.connectionHistory = (Config.getConnHistory() || []);
    this.projects = (Config.getProjects() || []);
    this.completion_words = [];

    this.getAll = function(){return this.tabs;};

    this.newTab = function(connstr){
        if (typeof(connstr) == 'undefined'){
            connstr = this.getConnstr(this.selectedTab);
        }
        if (this.selectedTab > 0) {
            password = this.tabs[this.selectedTab].password;
        } else {
            password = null;
        }

        newid = TabSequence.nextval();
        this.tabs[newid] = new Tab(newid, connstr, password);
        this.order.push(newid);
        this.selectedTab = newid;

    };

    this.selectTab = function(id){
        if (id in this.tabs) {
            this.selectedTab = id;
        }
    };

    this.closeTab = function(id){
        delete this.tabs[id];
        idx = this.order.indexOf(id);
        this.order.splice(idx, 1);
        if (id == this.selectedTab) {
            if (idx <= this.order.length-1) {
                this.selectedTab = this.order[idx];
            } else {
                this.selectedTab = this.order[idx-1];
            };
        };
    };

    this.nextTab = function(){
        if (this.order.length <= 1) {
            return;
        };
        if (this.order.indexOf(this.selectedTab) == this.order.length-1){
            idx = 0;
        } else {
            idx = this.order.indexOf(this.selectedTab)+1;
        };
        this.selectedTab = this.order[idx];
    };

    this.previosTab = function(){
        if (this.order.length <= 1) {
            return;
        };
        if (this.order.indexOf(this.selectedTab) == 0){
            idx = this.order.length-1;
        } else {
            idx = this.order.indexOf(this.selectedTab)-1;
        };
        this.selectedTab = this.order[idx];
    };

    this.setTheme = function(theme){
        this.theme = theme;
    };

    this.getEditorTheme = function(){
        if (this.theme == 'dark'){
            return 'idle_fingers';
        } else {
            return 'chrome';
        };
    };

    this.setMode = function(mode){
        this.mode = mode;
    };

    this.getEditorMode = function(){
        if (this.mode == 'vim'){
            return 'ace/keyboard/vim';
        } else {
            return '';
        }
    };

    this.setFontSize = function(size){
        this.fontSize = size;
    };

    this.getFontSize = function(){
        return this.fontSize;
    }

    this.getConnstr = function(id){
        if (id in this.tabs) {
            return this.tabs[id].connstr;
        };
    };

    this.getPassword = function(id){
        if (id in this.tabs) {
            return this.tabs[id].password;
        };
    };

    this.setConnection = function(id, connstr){
        this.tabs[id].connstr = connstr;

        if (connstr == null || connstr == ""){ // don't track empty connstr
            return;
        }

        hist_idx = this.connectionHistory.indexOf(connstr);
        if (hist_idx == -1){ // add to history
            if (this.connectionHistory.length === 20){// limit history size
                this.connectionHistory.pop();
            };
            this.connectionHistory.unshift(connstr);
        } else { // shift to the beginning of history
            this.connectionHistory.splice(hist_idx, 1);
            this.connectionHistory.unshift(connstr);
        }
    };

    this.setPassword = function(id, password){
        this.tabs[id].password = password;
        connstr = this.getConnstr(id);
        for (var key in this.tabs){ // update password in all tabs with the same connstr
            if (this.tabs[key].connstr == connstr){
                this.tabs[key].password = password;
            }
        }
    };

    this.setResult = function(id, result){
        if (typeof(this.tabs[id]) != 'undefined'){
            this.tabs[id].result = result;
        }
    };

    this.getResult = function(id){
        if (id in this.tabs){
            return this.tabs[id].result;
        };
    };

    this.setError = function(id, error){
        if (id in this.tabs){
            this.tabs[id].error = error;
        };
    };

    this.getError = function(id){
        if (id in this.tabs){
            return this.tabs[id].error;
        };
    };

    this.openFile = function(filename){
        this.tabs[this.selectedTab].filename = filename;
    }

    this.saveFile = function(filename){
        this.tabs[this.selectedTab].filename = filename;
    }

    this.closeFile = function(){
        this.tabs[this.selectedTab].filename = null;
    }

    this.getEditorFile = function(id){
        if (id in this.tabs){
            return this.tabs[id].filename;
        };
    };

    this.getTabByFilename = function(filename){
        for (var id in this.tabs){
            if (this.tabs[id].filename == filename){
                return Number(id);
            }
        }
        return null;
    }

    this.setRenderer = function(renderer){
        this.renderer = renderer
    }

    this.getRenderer = function(){
        return this.renderer;
    }

    this.setSearchValue = function(value){
        this.searchValue = value;
    }

    this.getSearchValue = function(){
        return this.searchValue;
    }

    this.setObjectInfo = function(object){
        this.objectInfo = object;
    }

    this.getObjectInfo = function(){
        return this.objectInfo;
    }

    this.setHistoryItem = function(idx){
        this.historyItem = idx;
    }

    this.getHistoryItem = function(){
        return this.historyItem;
    }

    this.rereadConfig = function(){
        this.theme = (Config.getTheme() || 'dark');
        this.mode = (Config.getMode() || 'classic');
        this.connectionHistory = (Config.getConnHistory() || []);
    };

    this.setCloudDoc = function(docid){
        this.cloudDoc = docid;
    };

    this.getCloudDoc = function(){
        return this.cloudDoc;
    };

    this.setCloudError = function(error){
        this.cloudError = error;
    };

    this.getCloudError = function(){
        return this.cloudError;
    };

    this.addProject = function(dirname, alias){
        this.projects.push({path: dirname, alias: alias});
        Config.saveProjects(this.projects);
    }

    this.getProjects = function(){
        return this.projects;
    }

    this.removeProject = function(idx){
        this.projects.splice(idx, 1);
        Config.saveProjects(this.projects);
    }

    this.getCompletionWords = function(){
        return this.completion_words;
    }

    this.updateCompletionWords = function(words){
        this.completion_words = words; 
    }
        
    // restore recent connection string on startup
    if (typeof(Config.getConnHistory()) != 'undefined' && Config.getConnHistory().length > 0){
        connstr = Config.getConnHistory()[0];
        this.newTab(connstr);
    } else {
        this.newTab(); 
    }
    
};

MicroEvent.mixin(_TabsStore);  

TabsStore = new _TabsStore();


module.exports = TabsStore;
