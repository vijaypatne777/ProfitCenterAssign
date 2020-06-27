sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"sap/m/MessagePopover",
	"sap/m/MessageItem",
	"sap/m/Button",
	"sap/m/MessageBox"
], function (BaseController, JSONModel, formatter, Filter, FilterOperator, MessageToast, MessagePopover, MessageItem, Button, MessageBox) {
	"use strict";
    var oMessagePopover;
	return BaseController.extend("UploadProfit.UploadProftCenterAssignment.controller.Worklist", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function () {
			this._oTable = this.byId("profitTable");
			this._tModel = new sap.ui.model.json.JSONModel();
			this._rModel = new sap.ui.model.json.JSONModel();
			this._dModel = this.getOwnerComponent().getModel();
			this._oPromises = [];
			this._msgArr = [];
			this._aObj = [];
			this._msgData = {
				"msgs": this._msgArr
			};
			this._rData = {
				"trec": this._aObj
			};
			var cBut = this.byId("cUpload");
			cBut.setEnabled(false);
		},

		handleUploadPress: function () {

			var that = this;
			var oTable;
			oTable = this._oTable;
			var tarr = [];
			var tdata = {
				"trec": tarr
			};
			var oFileUpload = this.byId("fileUploader");

			if (!oFileUpload.getValue()) {

				MessageToast.show("Select the file first!");
				return;
			} else {

				var ofile = oFileUpload.getFocusDomRef();
				var file = ofile.files[0];
				if (file && window.FileReader) {
					var reader = new FileReader();
					reader.onload = function (oEvent) {

						var strCSV = oEvent.target.result;
						//			var arrCSV = strCSV.match(/[\w .]+(?=,?)/g);
						var arrCSV = strCSV.replace(/\n/g, ",").split(",");
						var noOfCols;

						noOfCols = 6;

						var headerRow = arrCSV.splice(0, noOfCols);
						// arrCSV.length 

						while ((arrCSV.length - 1) > 0) {
							var obj = {};
							var pobj = {};
							var row = arrCSV.splice(0, noOfCols);

							for (var i = 0; i < row.length; i++) {
								var sdata = row[i].trim();

								switch (i) {

								case 0:
									pobj["Operation"] = sdata;
									break;
								case 1:
									pobj["CCode"] = sdata;
									break;

								case 2:
									pobj["CGroup"] = sdata;
									break;

								case 3:
									pobj["MGroup"] = sdata;
									break;
								case 4:
									pobj["PCenter"] = sdata;
									break;

								case 5:

									pobj["EDate"] = sdata;
									break;

								}

							}
							tarr.push(pobj);
						}

						that._tModel.setData(tdata);
						oTable.setModel(that._tModel);
						var uBut = that.byId("cUpload");
						uBut.setEnabled(true);
						that.byId("fileUploader").setEnabled(false);
						that.byId("tUpload").setEnabled(false);
			//			that.byId("rgM").setEnabled(false);

					};

					reader.readAsBinaryString(file);
				}
			}

		},
		handlePost: function () {
			var that = this;
			var count = 0;
			sap.ui.core.BusyIndicator.show();
			Promise.allSettled = function (oPromises) {

				oPromises.forEach(function (r) {
					r.then(function (param) {

						count = count + 1;
						that._sMCount = count;
						if (count === (that._oPromises.length)) {

							//							MessageToast.show(count + "Production Order Confirmation successfully Created");
							that.promiseCompleted();
						}
						return r;

					}, function (error) {
						count = count + 1;
						if (count === (that._oPromises.length)) {

							that.promiseCompleted();
						}
						return r;
					});

				});
				return oPromises;
			};
			var tPromises = [];

			tPromises = this.uploadProfitCenterData();

			var cPromise = Promise.allSettled(tPromises);

		},
		handleRefresh: function () {
			this._tModel.setData();
			this._rModel.setData();
			this._sMCount = 0;
			this._oPromises = [];
			this._bPromises = [];
			this._msgArr = [];
			this._aObj = [];
			this._msgData.msgs = {};
			this._rData.trec = {};

			this.byId("cUpload").setEnabled(false);
			this.byId("tUpload").setEnabled(true);
			this.byId("fileUploader").setEnabled(true);
//			this.byId("rgM").setEnabled(true);
			this.byId("fileUploader").clear();
			var oBut = sap.ui.getCore().byId("logBut");
			if (typeof oBut !== "undefined") {
				oBut.destroy();
			}
		},

		uploadProfitCenterData: function () {
		
			var allPromises = [];
			var oPromise;
			var tData = this._tModel.getData();
			for (var j = 0; j < tData.trec.length; j++) {
				var lobj = {};
                lobj["Operation"] = tData.trec[j].Operation;
                lobj["CCode"] = tData.trec[j].CCode;
                lobj["CGroup"] = tData.trec[j].CGroup;
                lobj["MGroup"] = tData.trec[j].MGroup;
                lobj["PCenter"] = tData.trec[j].PCenter;
                lobj["EDate"] = tData.trec[j].EDate;
				
				if (tData.trec[j].Operation == 'C' || tData.trec[j].Operation == 'c') {
					oPromise = this.createPCData(tData.trec[j],j,lobj);
				}
				if (tData.trec[j].Operation == 'U' || tData.trec[j].Operation == 'u') {
					oPromise = this.updatePCData(tData.trec[j],j,lobj);
				}
				allPromises.push(oPromise);

			}
			return allPromises;
		},
		createPCData: function (oData,ind,lobj) {
			var obj = {};
		    
            var gID = "BatchReq" ;
            gID = gID + ind;
            
			obj.YY1_FIN_CF_COMPANY_CODE = oData.CCode.toUpperCase();
			obj.YY1_FIN_CF_CUSTOMER_GR = oData.CGroup.toUpperCase();
			obj.YY1_FIN_CF_MATERIAL_GRP = oData.MGroup.toUpperCase();
			obj.YY1_FIN_CF_PROFIT_CENTER = oData.PCenter.toUpperCase();
			oData.EDate = oData.EDate + "T00:00:00";
			obj.YY1_FIN_CF_EXP_DATE = oData.EDate;

			var dModel = this._dModel;
			var that = this;
			var tPromise = new Promise(function (resolve, reject) {

				dModel.create('/YY1_FIN_CB_PROFIT_CENTER', obj, {
					success: function (oResponse) {
						var msgObj = {};
                     
						msgObj["Mtype"] = "Success";
						msgObj["Msg"] = "Profit Center Assignment Data is uploaded successfully";
					    lobj["msg"] = 	msgObj["Msg"];
					    that._msgArr.push(msgObj);
					    that._aObj.push(lobj); 
						resolve();

					},
					error: function (oError) {

						var msgObj = {};

						msgObj["Mtype"] = "Error";
						msgObj["Msg"] = oError.responseText;
						lobj["msg"] = 	msgObj["Msg"];
						that._aObj.push(lobj); 
						that._msgArr.push(msgObj);
					
						reject();

					},
					groupId: gID
				});
			});
			this._oPromises.push(tPromise);
			return tPromise;

		},
		
		displayLog: function()
		{
			
			var oTable;

			oTable = this._oTable;

			this._rData.trec = this._aObj;
			this._msgData.msgs = this._msgArr;
			this._rModel.setData(this._rData);
			oTable.setModel(this._rModel);
			var oMessageTemplate = new MessageItem({
				type: "{type}",
				title: "{title}",
				activeTitle: "{active}",
				description: "{description}",
				subtitle: "{subtitle}",
				counter: "{counter}",

			});

			oMessagePopover = new MessagePopover({
				items: {
					path: '/',
					template: oMessageTemplate
				},
				activeTitlePress: function () {

				}
			});

			var scount = 0;
			var ecount = 0;
			var aMockMessages = [];
			for (var k = 0; k < this._msgArr.length; k++) {
				var mobj = {};
				if (this._msgArr[k].Mtype == "Success") {
					mobj["type"] = this._msgArr[k].Mtype;
					mobj["title"] = "Success Message";
					mobj["active"] = false;
					mobj["description"] = this._msgArr[k].Msg;
			
						mobj["subtitle"] = this.getView().getModel("i18n").getResourceBundle().getText("sMsg");
				
				
					scount = scount + 1;
					mobj["conunter"] = scount;
				} else {

					mobj["type"] = this._msgArr[k].Mtype;
					mobj["title"] = "Error Message";
					mobj["active"] = true;
					mobj["description"] = this._msgArr[k].Msg;
				
						mobj["subtitle"] = this.getView().getModel("i18n").getResourceBundle().getText("eMsg");
				
					ecount = ecount + 1;
					mobj["conunter"] = scount;
				}
				aMockMessages.push(mobj);
			}
			var oModel = new sap.ui.model.json.JSONModel();
			oModel.setData(aMockMessages);
			this.getView().setModel(oModel);
			var oButton = new Button({
				id: "logBut",
				text: "Log",
				type: "Emphasized",
				width: "6rem"
			});
			//			oButton.addStyleClass("sapUiMediumMarginTop");
			oButton.addDependent(oMessagePopover);
			oButton.attachPress(this.handleMessagePopoverPress);
			var oTool = this.getView().byId("oToolBar");
			oTool.addContent(oButton);
			this.byId("cUpload").setEnabled(false);
			this.byId("tUpload").setEnabled(false);
			this.byId("fileUploader").setEnabled(false);
		
		},
		
		promiseCompleted: function()
		{
			sap.ui.core.BusyIndicator.hide();
			this.displayLog();
		},
			handleMessagePopoverPress: function (oEvent) {
			oMessagePopover.toggle(oEvent.getSource());
		},
		updatePCData: function (oData,ind,lobj)
		{
			var obj = {};
			var nobj = {};
			var oFilters = [];
			var oFltr={};
		    var gID = "BatchReq" ;
            gID = gID + ind;
            var ccode = oData.CCode.toUpperCase();
	        oFltr = new Filter("YY1_FIN_CF_COMPANY_CODE",FilterOperator.EQ ,ccode );
	        oFilters.push(oFltr);
	        
	        var cgrp = oData.CGroup.toUpperCase();
	        oFltr = new Filter("YY1_FIN_CF_CUSTOMER_GR",FilterOperator.EQ ,cgrp );
	        oFilters.push(oFltr);
			
			var mgrp = oData.MGroup.toUpperCase();
	        oFltr = new Filter("YY1_FIN_CF_MATERIAL_GRP",FilterOperator.EQ ,mgrp );
	        oFilters.push(oFltr);
	        
	
			nobj.YY1_FIN_CF_PROFIT_CENTER = oData.PCenter.toUpperCase();
			oData.EDate = oData.EDate + "T00:00:00";
			nobj.YY1_FIN_CF_EXP_DATE = oData.EDate;

		

		    var lPromise = this.updatePCAssignment(lobj,nobj,oFilters);
			this._oPromises.push(lPromise);
			return lPromise;

		},
		updatePCAssignment: function(lobj,nobj,oFilters )
		{   
			var that = this;
			var dModel = this._dModel;
		
			var tPromise = new Promise(function (resolve, reject) {
          
			var rPromise = new Promise(function(resolve,reject) { 
				  
				  dModel.read('/YY1_FIN_CB_PROFIT_CENTER',  {
					success: function (oResponse) {
						var pty = "results";
						if ( pty in oResponse )
						{
						if (oResponse.results.length !== 0 )
						{
						var SUID = oResponse.results[0].SAP_UUID;
							resolve(SUID);
						}else{
					    var msgObj = {};
					    msgObj["Mtype"] = "Error";
						msgObj["Msg"] = "Profit Center assignment data does not exist!";
						lobj["msg"] = 	msgObj["Msg"];
						that._aObj.push(lobj); 
						that._msgArr.push(msgObj);
						resolve("Error");
						}
						
						}else {
					    var msgObj = {};
					    msgObj["Mtype"] = "Error";
						msgObj["Msg"] = "Profit Center assignment data does not exist!";
						lobj["msg"] = 	msgObj["Msg"];
						that._aObj.push(lobj); 
						that._msgArr.push(msgObj);
							  resolve("Error");
						}
		
					
					},
					error: function (oError) {

						var msgObj = {};

						msgObj["Mtype"] = "Error";
						msgObj["Msg"] = oError.responseText;
						lobj["msg"] = 	msgObj["Msg"];
						that._aObj.push(lobj); 
						that._msgArr.push(msgObj);
					    resolve("Error");

					},
					filters: oFilters
			
				});
			});
				
				rPromise.then(function(val) 
				{
				if ( val === "Error")
				{
					reject();
				}else{
				var sPath = dModel.createKey("/YY1_FIN_CB_PROFIT_CENTER", {
							SAP_UUID: val
							});
				  dModel.update(sPath, nobj, {
					success: function (oResponse) {
					   	var msgObj = {};
					   	msgObj["Mtype"] = "Success";
						msgObj["Msg"] = "Profit Center Assignment Data is updated successfully";
					    lobj["msg"] = 	msgObj["Msg"];
					    that._msgArr.push(msgObj);
					    that._aObj.push(lobj); 
						resolve();
					
					},
					error: function (oError) {

						var msgObj = {};

						msgObj["Mtype"] = "Error";
						msgObj["Msg"] = oError.responseText;
						lobj["msg"] = 	msgObj["Msg"];
						lobj["success"] = " ";
				
						that._aObj.push(lobj); 
						that._msgArr.push(msgObj);
					    reject();
					   

					},
					filters: oFilters
			
				});	
				}
			
				 });
				
		
			});
			return tPromise;
			
		},
		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Triggered by the table's 'updateFinished' event: after new table
		 * data is available, this handler method updates the table counter.
		 * This should only happen if the update was successful, which is
		 * why this handler is attached to 'updateFinished' and not to the
		 * table's list binding's 'dataReceived' method.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished: function (oEvent) {},

		/**
		 * Event handler when a table item gets pressed
		 * @param {sap.ui.base.Event} oEvent the table selectionChange event
		 * @public
		 */
		onPress: function (oEvent) {

		},

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function () {

		},

		onSearch: function (oEvent) {},

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh: function () {

		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Shows the selected item on the object page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showObject: function (oItem) {

		},

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
		 * @private
		 */
		_applySearch: function (aTableSearchState) {

		}

	});
});