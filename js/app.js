var loadApiError = function(apiname){
alert('不能调用'+apiname+'api，请检查网络');
}



//保存6个地点名称
const myPlaces=['广州海军华海大厦', '富力天域中心', '晓港公园', '中山大学','富力海珠城广场', '明记海鲜城'];


// Create a map variable

var map;					//全屏地图
var addressResults=[];		//地理位置数组
var markers=[];				//标记数组
var infowindows=[];			//信息框数组
var filterTimeout;			//计时器，输入后执行筛选地点
var flickrImages={};		//对应地点数组的flickr照片地址数组
//infowindows.push('yy');

var count=myPlaces.length;

//拉取flickr
function getFlickrImage(){
	return new Promise((resolve, reject)=>{
	let base_url='https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=5f8dc283bd00bd81388fbb1c26e79259&format=json&nojsoncallback=1';
	let i=0;
	//根据地点名称从flick查询匹配photo id
	for (let place of myPlaces){
		let j=i;
		let tag_query='&tags='+place;
		let api_url=base_url+tag_query;
		fetch(api_url)
		  .then(response=>{
			  let data=response.json();
			  //console.log(json2);
			return data;
		  }).then(function(data) {
			  //保存第一个photo id
			  if(data.photos.total>0){
				let photoid=data.photos.photo[0].id;
					console.log(photoid);
					return photoid;
				}
				else{
					console.log('no pic');
					return 0;
				}
		  }).then(photoid=>{
			  //拉取对应photoid下的全部照片
			let url='https://api.flickr.com/services/rest/?method=flickr.photos.getSizes&api_key=5f8dc283bd00bd81388fbb1c26e79259&format=json&nojsoncallback=1&photo_id='+photoid;
			 fetch(url).then(response=>{
				 return response.json();
				}).then(data=>{
					//console.log(data);
					if(data.stat=='fail'){
						flickrImages[j]='nopic';
						return j;
					}
					//保存第一张宽度大多320的照片
					for (let image of data.sizes.size){
						if(image.width>=320){
							flickrImages[j]=image.source;
							//console.log(image.source);
							return j;
						}
					}
					flickrImages[j]='nopic';
					//console.log(data.sizes.size);
					return j;
				}).then(j=>{
					count--;
					//console.log(count);
					//console.log(flickrImages[j]);
					if(count==0){
						console.log('resolve');
						console.log(flickrImages);
						resolve(j);
						}
					}); 
			 });
			 i++;
	}
		
	});
}

// Function to initialize the map within the map div
	 
	 //获取地理位置，异步，返回promise，根据status执行reject或resolve
	 function getGeocode(address, img){
		let geocoder = new google.maps.Geocoder();
		return new Promise(function(resolve, reject){
			geocoder.geocode({'address': address}, function(results, status){
				//map.setCenter(results[0].geometry.location);
				//console.log(results);
				if (status !== google.maps.GeocoderStatus.OK) {
					return reject('cannot find address :'+address);
				}
				addressResults.push(results[0]);
				let marker = new google.maps.Marker({
					map: map,
					position: results[0].geometry.location,
					animation:google.maps.Animation.DROP
				});
				console.log('lat:'+marker.position.lat()+' | lng:'+marker.position.lng());
				markers.push(marker);
				//如有flickr照片，放到infowindow里
				let img_content=img=='nopic'?'未发现flickr照片':`<img src="${img}" />`;
				let infowindow=new google.maps.InfoWindow({
				   content: results[0].formatted_address+' | '+img_content,
				 });
				infowindows.push(infowindow);
				let length=markers.length;
				marker.addListener('click', function(){
					openInfoWindow(length-1);
				});
				console.log(address);
				resolve(address);
			});
			
		});
	 }
	 
	 
	//根据键值和显示参数使标记显示或隐藏的方法
	function markerDisplay(index, show){
		//console.log(index);
		if(show){
			markers[index].setMap(map);
		}
		else{
			markers[index].setMap(null);
		}
	}
	
	
	//信息框数组对应键值显示信息框方法
	function openInfoWindow(index){
		//console.log(index);
		for(let window of infowindows){
			window.close();
		}
		//console.log(index);
		let infowindow=infowindows[index];
		let marker=markers[index];
		let location=addressResults[index].geometry.location;
		infowindow.open(map, marker);
		map.panTo(location);
	}
	
	//根据输入文字筛选地点方法，输入后无动作1秒执行
	function filter(text){
		clearTimeout(filterTimeout);
		filterTimeout=setTimeout(function(){
			let regexp=new RegExp("[" + text + "]","i");
			_.map(text);
			console.log(text);
			}, 1000);
		//console.log(text);
	}
	 
	 
	 //初始化地图
     function initMap() {
		 map = new google.maps.Map(document.getElementById('map'), {
			 zoom: 14
		   });
		  getFlickrImage().then(res=>{
			  let i=0;
			   for(let place of myPlaces){
				   //console.log(flickrImages);
				   console.log(i+'|'+flickrImages[i]);
				  getGeocode(place, flickrImages[i]).then(res=>{map.setCenter(addressResults[0].geometry.location);});
				  i++;
				}
			});
		  
		 
	 
	 //获取全部地理位置，每个位置异步执行且按顺序排列
	 /*
	 var loadPlaces=new Promise(function(resolve){
		let sequence=Promise.resolve();
		for(let place of myPlaces){
			sequence.then(function(res){
				getGeocode(place)
				.then(function(res){
					console.log('then call multi');		//这里执行N次
					resolve('why resolve call once');	//为什么resolve只执行1次
				}).catch(function(res){alert(res)})
				.then(function(resolve){
					console.log('why call multi and call after following code: loadPlaces.then?');	//这个then为什么执行在下面的then之后
				});		
			});
		}
	 });
	 */
	   
	   /*
	   //获取完全部位置后设置地图中心为第一个位置坐标
	   loadPlaces.then(function(res){
		   console.log(res);
		   	console.log('why call before above code');
			map.setCenter(addressResults[0].geometry.location);
	   });
	   */
	   
	   /*
	   promise部分的结果看不明白，具体请看上面注释和console.log的结果
	   */
	   
     }
	 
	 
//knockout 绑定初始化

function koInit(){
	var self = this;
	self.filterText='';						//筛选框文字
	self.oPlaces = ko.observableArray();	//地点名称数组，克隆自myPlaces
	for(let place of myPlaces){
		self.oPlaces.push(place);
	}
	
	
	
	
	//左侧列表点击事件，显示信息框
	self.selectMarker=function(item){
		console.log(item);
		let index=_.indexOf(myPlaces, item);
		if(index>-1){
			openInfoWindow(index);
		}
	}
	
	//重置文字格式数组
	self.resetPlaces=function(){
		self.oPlaces.removeAll();
		//let i=0;
		for(let place of myPlaces){
			self.oPlaces.push(place);
			//markerDisplay(i, true);
			//i++;
		}
	}
	
	//筛选方法
	self.filter=function(){
		let that=self;
		clearTimeout(filterTimeout);
		let places=self.oPlaces();
		let filterText=self.filterText;
		//console.log(self.oPlaces);
		//输入框空侧重置地图和列表
		if(!self.filterText.length){
			console.log('clear');
			self.resetPlaces();
			for(let i=0; i<self.oPlaces().length; i++){
				markerDisplay(i, true);
			}
		}
		else{
			//执行定时器筛选位置
			filterTimeout=setTimeout(function(){
				let regexp=new RegExp(filterText,"gim");
				let removePlaces=_.filter(myPlaces, function(place){return ! regexp.test(place);});	//不符合条件的地点名称数组
				console.log(removePlaces);
				//先显示全部地点
				for(let i=0; i<myPlaces.length; i++){
					markerDisplay(i, map);
				}
				//再隐藏不符合条件的地点
				for(let place of removePlaces){
					let index=_.indexOf(myPlaces, place);
					markerDisplay(index, false);
				}
				//先重置地点名称数组，再删不符合条件的地点名称
				that.resetPlaces();
				that.oPlaces.remove(function(place){return ! regexp.test(place);});
			}, 1000);
		}
	}
	return self;
}
