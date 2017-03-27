$(function() { 

	//initializations
	var template = $('#hidden-template').html();
	var tours = [];
	var toursToBeShown = [];
	var sortingField = "rating";
	var monthsArray = [];
	var ordField = "start";
	var duration = [3,100];
	var monthFilter = "";

	//read json file
	jQuery.get({
		url:'tours.json',
		async:false}, function(data) {
		tours = data;
		toursToBeShown = data;
	});

	showTours();
	populateDepartureList();
	toggleSidenavVisibility();

	//FUNCTIONS

	//tours list creations
	function showTours(){

		today = getCurrentDate();

		for(i = 0;i<toursToBeShown.length;i++){
			toursToBeShown[i].datesToShow =  []
			for(j=0; j<toursToBeShown[i].dates.length;j++){
				instance = toursToBeShown[i].dates[j];
				if(instance.availability > 0 && instance.start >= today && (monthFilter == null || instance.start.indexOf(monthFilter) >=0)){
					toursToBeShown[i].datesToShow.push(toursToBeShown[i].dates[j]);
				}
			}
		}
		console.log(toursToBeShown);
		//sort the list of tours based on the "ordField" value
		if(ordField == "start"){
			toursToBeShown = toursToBeShown.sort(function(a,b){
				if(a.datesToShow.length > 0 && b.datesToShow.length > 0)
					return a.datesToShow[0][ordField] > b.datesToShow[0][ordField];
			});
		}
		else if(ordField.indexOf("rev") >= 0){
			o = ordField.substring(0, ordField.indexOf("-rev")) 
			toursToBeShown = toursToBeShown.sort(function(a,b){
				return a[o] < b[o];
			})
		}
		else{
			toursToBeShown = toursToBeShown.sort(function(a,b){
				return a[ordField] > b[ordField];
			})
		}

		//empty the view to remove old entries
		$('#content').empty();

		//loop over the list of tours
		for(i = 0; i<toursToBeShown.length; i++){
			tour = toursToBeShown[i];

			//check the tours are within the "duration" boundaries
			if(tour.length > duration[0] && tour.length < duration[1]){

				//variable used to stop the overriding of the "price" entry
				var nextPrice = -1;
				var today = getCurrentDate();
				//tour unique id
				uniqueId = tour.id;

				//actually populates the view with the "remaining" entries, if there are
				if(tour.datesToShow.length > 0){

					//appends a row foreach tour and populates it with the template
					$('#content').append('<div class="col-xs-12 col-sm-6 col-md-12 mrg8b tourRow" id="'+uniqueId+'"></div>');
					$('#'+uniqueId).append(template);

					//populate the first section of the row (image and ratings)
					$('#'+uniqueId + ' .imgContainer').css('background-image', 'url(' + tour.images[0].url + ')');
					//add stars to the show the tour rating
					for(k = 0; k< tour.rating; k++){
						if(k+0.5 == tour.rating){
							$('#'+uniqueId + ' .starContainer').append('<img src="assets/halfstar.png"/>');
						}
						else{
							$('#'+uniqueId + ' .starContainer').append('<img src="assets/star.svg"/>');
						}
					}

					//populate the second section of the row (title, description and basic information)
					indOfSpace = tour.description.substring(100).indexOf(" ")+100;
					citiesVisited = tour.cities.length
					$('#'+uniqueId + ' .titleContent strong').text(tour.name);
					$('#'+uniqueId + ' .descriptionContent').text(tour.description.substring(0, indOfSpace)+"...");
					$('#'+uniqueId + ' .daysContent').text(tour.length + " days");
					$('#'+uniqueId + ' .destinationsContent').text(citiesVisited + " cities");
					$('#'+uniqueId + ' .startsendsContent').text(tour.cities[0].name + "/" + tour.cities[citiesVisited-1].name);
					$('#'+uniqueId + ' .operatorContent').text(tour.operator_name);
					$('#'+uniqueId + ' .revContainer').text(tour.reviews + " reviews");

					//populate the last section of the row (price and dates)
					for(j=0; j<tour.datesToShow.length; j++){
						
						instance = tour.datesToShow[j];
						dayMonth = formatDate(instance.start, "dayMonth");

						//used for displaying
						monthYear = formatDate(instance.start, "monthYear");
						//used for unique identification of the date
						monthYear2 = formatDate(instance.start, "monthYear2");

						//populate the price entry with the price of the first available date for the tour
						if(nextPrice == -1){
							nextPrice = instance.usd;
							if(instance.discount){
								$('#'+uniqueId + ' .discountContent strong').text("-" + instance.discount);
							}
							else{
								$('#'+uniqueId + ' .imgHeader').hide();
							}
						}
						$('#'+uniqueId + ' .priceContent h3').text("$ "+ nextPrice);

						//populates the "dates" section with the first 2 available dates
						if(j<2){
							$('#'+uniqueId + ' .dateContent'+j).text(dayMonth);
							$('#'+uniqueId + ' .seatsContent'+j).append(instance.availability + " seats left");
							if(instance.availability <=3){
								$('#'+uniqueId + ' .seatsContent'+j).css('color', 'red');
							};
						}

						//support vectors used for the list displayed in the filters
						if(monthYear in monthsArray){
							monthsArray[monthYear].amount += 1;
							monthsArray[monthYear].monthYear2 = monthYear2;
						}
						else{
							monthsArray[monthYear] = {};
							monthsArray[monthYear].amount = 1;
							monthsArray[monthYear].monthYear2 = monthYear2;
						}
					}
				}
			}
		}
	}

	//populates the "departure dates" list filter
	function populateDepartureList(){
		for(key in monthsArray){
			$("#departureDateContent").append("<div class='row pad8t departureRow' id='"+monthsArray[key].monthYear2+"'><div class='col-xs-12'>"+key+" <span class='colorGrey amount'>("+monthsArray[key].amount+")</span></div></div>")
		}
	}

	//function fired when the user change the duration boundaries
	function changeRange(values){
		$('#startRange').text(values[0] + " days");
		$('#endRange').text(values[1] + " days");
		duration = values;
		showTours();
	};

	//function to get the current date, used to show only new tours
	function getCurrentDate(){
		var today = new Date();
		var dd = today.getDate();
		var mm = today.getMonth()+1;
		var yyyy = today.getFullYear();

		if(dd<10) {
		    dd='0'+dd
		} 

		if(mm<10) {
		    mm='0'+mm
		} 
		today = yyyy+'-'+mm+'-'+dd; 
		return today;
	}

	//function to toggle the visibility of the sidenav content
	function toggleSidenavVisibility(){
		var width = $(document).width();
		if(width < 992){
	  		closeDepartureDate();
	  		closeDuration();
		}
		else{
			openDepartureDate();
			openDuration();
		}
	}

	//closes the "departure dates" content 
	function closeDepartureDate(){
		$("#closeDepartureDate").addClass("invisible");
		$("#openDepartureDate").removeClass("invisible");
		$("#departureDateContent").slideUp("slow");
		$("#departureDatePicker").slideUp("slow");
	}

	//closes the "duration" content
	function closeDuration(){
		$("#closeDuration").addClass("invisible");
		$("#openDuration").removeClass("invisible");
		$("#durationContent").slideUp("slow");
		$("#durationSlider").slideUp("slow");
	}

	//opens the "departure dates" content
	function openDepartureDate(){
		$("#closeDepartureDate").removeClass("invisible");
		$("#openDepartureDate").addClass("invisible");
		$("#departureDateContent").slideDown("slow");
		$("#departureDatePicker").slideDown("slow");
	}

	//opens the "duration" content
	function openDuration(){
		$("#closeDuration").removeClass("invisible");
		$("#openDuration").addClass("invisible");
		$("#durationContent").slideDown("slow");
		$("#durationSlider").slideDown("slow");
	}

	//format the date as required in the different section of the page
	function formatDate(date, format){
		dateArray = date.split("-");
		year = dateArray[0];
		month = dateArray[1];
		day = dateArray[2];

		monthText = "";
		monthTextExt = "";
		switch(month){
			case "01" : monthText = "Jan"; monthTextExt = "January"; break;
			case "02" : monthText = "Feb"; monthTextExt = "February"; break;
			case "03" : monthText = "Mar"; monthTextExt = "March"; break;
			case "04" : monthText = "Apr"; monthTextExt = "April"; break;
			case "05" : monthText = "May"; monthTextExt = "May"; break;
			case "06" : monthText = "Jun"; monthTextExt = "June"; break;
			case "07" : monthText = "Jul"; monthTextExt = "July"; break;
			case "08" : monthText = "Aug"; monthTextExt = "August"; break;
			case "09" : monthText = "Sep"; monthTextExt = "September"; break;
			case "10" : monthText = "Oct"; monthTextExt = "October"; break;
			case "11" : monthText = "Nov"; monthTextExt = "November"; break;
			case "12" : monthText = "Dec"; monthTextExt = "December"; break;
		}

		if(format == "dayMonth")
			return day + " " + monthText;
		else if(format == "monthYear")
			return monthTextExt + " " + year;
		else if(format == "monthYear2")
			return year + "-" + month;
	}

	//LISTENERS
	//listen the resize of te window
	$(window).resize(toggleSidenavVisibility);

	//format the datepicker
	$('#datetimepicker').datetimepicker({
		format: 'YYYY-MM-DD'
	}).on("dp.change", function(e) { //listen the selection of the date
		if(e.oldDate != null && e.oldDate != e.date){
    		monthFilter = $('#selectedDate').val();
    		$(".departureRow").removeClass("selected");
			$(".departureRow .amount").removeClass("selected")
    		showTours();
    	}
	})

	//listen the manual insertion of the date
	$("#selectedDate").on("change paste keyup", function() {
    	if($('#selectedDate').val().length == 10){
    		monthFilter = $('#selectedDate').val();
    		$(".departureRow").removeClass("selected");
			$(".departureRow .amount").removeClass("selected")
    		showTours();
    	}
	});

	//format the slider
	$("#slider").slider({ id: "sliderInstance", min: 3, max: 30, range: true, value: [3, 30] });
	//listen to slider's changes
	$("#slider").on("slide", function(range) {
		changeRange(range.value);
	});

	//listen the click on the "departure dates" entries
	$(".departureRow").click(function(event){
		if(monthFilter == "" || monthFilter != this.id){
			monthFilter = this.id;
			$(".departureRow").removeClass("selected")
			$(".departureRow .amount").removeClass("selected")
			$("#"+monthFilter).addClass("selected")
			$("#"+monthFilter + " .amount").addClass("selected")
			showTours();
		}
		else{
			monthFilter = "";
			$(".departureRow").removeClass("selected");
			$(".departureRow .amount").removeClass("selected");
			showTours();
		}
	});

	//listen the click on the "sort by" entries
	$(".orderingField").click(function(event){
		ordField = this.id;
		if(ordField.indexOf("-xs") >0){
			ordField = ordField.substring(0,ordField.indexOf("-xs"));
		}
		$(".orderingField").removeClass("selectedReverse");
		$("#"+ordField).addClass("selectedReverse");
		$("#"+ordField+"-xs").addClass("selectedReverse");
		$("#selectedField").html($("#"+ordField).text()+' <span class="caret"></span>')
		$("#selectedField-xs").html("<strong>Sort by:</strong> "+$("#"+ordField).text()+' <span class="caret"></span>')
		showTours();
	});

	//listeners for the caret placed in the sidenav
	$("#closeDepartureDate").click(function(){
		closeDepartureDate();
	});
	$("#openDepartureDate").click(function(){
		openDepartureDate();
	});
	$("#closeDuration").click(function(){
		closeDuration();
	});
	$("#openDuration").click(function(){
		openDuration();
	});
});