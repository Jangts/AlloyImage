/*
 * @author:Bin Wang
 * @description: Main
 *
 */

//删除几个元素   arr为数组下标 
Array.prototype.del = function(arr){

    arr.sort();
    var b = this.concat([]);
    for(var i = arr.length - 1;i >= 0;i --){
        b = b.slice(0,arr[i]).concat(b.slice(arr[i] + 1));
    }
    return b;
};

HTMLImageElement.prototype.loadOnce = function(func){//图片的初次加载才触发事件，后续不触发
   var i = 0;
   this.onload = function(){
        if(!i) func.call(this,null);
        i ++;
   };
};

;(function(Ps){


    var P = {//被所有对象引用的一个对象,静态对象,主处理模块

        lib: [],//模块池

        init: function(){//初始化准备
            this.require("config");
        },

        module: function(name,func){//模块
            this.lib[name] = func.call(null, this);
        },

        require: function(name){//加载文件
            var _this = this;
            var scriptLoader = document.createElement("script");
            document.body.appendChild(scriptLoader);
            scriptLoader.src = "./js/module/" + name + ".js";
            scriptLoader.onload = scriptLoader.onerror = function(e){
                _this.handlerror(e);
            }
        },

        handlerror: function(e){//错误处理部分
            //this.destroySelf("程序因未知原因中断");
        },

        destroySelf: function(msg){//程序被迫自杀，杀前请留下遗嘱
            delete window[Ps];
            var e = new Error(msg);
            throw(e);
        },

        reflect: function(method,imgData,args){//映射器,将中文方法或...映射为实际方法
            var moduleName = this.lib.config.getModuleName(method);//得到实际的模块名称
            return this.lib[moduleName].process(imgData,args);//交由实际处理数据单元处理
        },

        reflectEasy: function(effect){
            var fun = this.lib.config.getEasyFun(effect);
            return this.lib.easy.getFun(fun);
        },

        add: function(lowerData,upperData,method,alpha,dx,dy,isFast,channel){
            return this.lib.addLayer.add(lowerData,upperData,method,alpha,dx,dy,isFast,channel);
        },

        applyMatrix: function(imgData,matrixArr){//对图像进行掩模算子变换
        }



    };

//返回外部接口
    window[Ps] = function(img,width,height){
        if(this instanceof window[Ps]){
        /*
            var image = new Image();
            image.src = img;
            image.onload = function(){
            */
            var canvas = document.createElement("canvas");
            var context = canvas.getContext("2d");

            if(!isNaN(img)){//var l = psLib(20,30);构造适配
                canvas.width = img;
                canvas.height = width;
                height = height || "rgba(255,1,1,0)";
                context.fillStyle = height;
                context.fillRect(0,0,img,width);
            }else{

                /*
                document.body.appendChild(img);
                var computedStyle = getComputedStyle(img);
                canvas.width = parseInt(computedStyle.getPropertyValue("width"));
                canvas.height = parseInt(computedStyle.getPropertyValue("height"));
                context.drawImage(img,0,0);
                //img.style.display = "none";
                */

                canvas.width = parseInt(img.width);
                canvas.height = parseInt(img.height);

                var computedStyle = getComputedStyle(img);
                imgWidth = parseInt(computedStyle.getPropertyValue("width"));
                imgHeight = parseInt(computedStyle.getPropertyValue("height"));

                if(!isNaN(imgWidth)) context.drawImage(img,0,0,imgWidth,imgHeight);
                else context.drawImage(img,0,0);

            }
            //canvas.draggable = "draggable";


            //document.body.appendChild(canvas);

            this.canvas = canvas;
            this.context = context;
            this.imgData = context.getImageData(0,0,canvas.width,canvas.height);

            this.name = Ps + "_" + Math.random();
            this.canvas.id = this.name;
            this.layers = [];//记录挂接到图层上的对象的引用

            /*
            }
            */
            
        }else{
            return new window[Ps](img,width,height);//返回自身构造对象
        }
    };

    window[Ps].module = function(name, func){
        P.module(name,func);
    };

    window[Ps].prototype = {//原型对象

        act: function(method,arg){
            var args = [];
            for(var i = 0;i < arguments.length;i ++){
                if(i == 0) continue;
                args.push(arguments[i]);
            }

            P.reflect(method,this.imgData,args);

            return this;
        },
        view: function(method,arg1,arg2,arg3,arg4){//预览模式 ，所有的再操作全部基于原点，不会改变本图层的效果，直到act会去除这部分图层
            var newLayer = this.clone();
            newLayer.type = 1;
            this.addLayer(newLayer,"正常",0,0);
            newLayer.act(method,arg1,arg2,arg3,arg4);

            return this;
        },

        excute: function(){//将view的结果执行到图层
            var layers = this.layers;
            var n = layers.length;
            if(layers[n - 1] && layers[n - 1][0].type == 1){
                this.imgData = layers[n - 1][0].imgData;
                delete layers[n - 1];
            }
        },

        cancel: function(){//取消view的结果执行
            var layers = this.layers;
            var n = layers.length;
            if(layers[n - 1] && layers[n - 1][0].type == 1){
                delete layers[n - 1];
            }
        },
        show: function(selector,isFast){//isFast用于快速显示

            //创建一个临时的psLib对象，防止因为合并显示对本身imgData影响
            var tempPsLib = new window[Ps](this.canvas.width,this.canvas.height);
            tempPsLib.add(this,"正常",0,0,isFast);
            this.tempPsLib = tempPsLib;

            //将挂接到本对象上的图层对象 一起合并到临时的psLib对象上去 用于显示合并的结果，不会影响每个图层，包括本图层
            for(var i = 0;i < this.layers.length;i ++){
                var tA = this.layers[i];
                var layers = tA[0].layers;
                var currLayer = tA[0];
                if(layers[layers.length - 1] && layers[layers.length - 1][0].type == 1) currLayer = layers[layers.length - 1][0];
                tempPsLib.add(currLayer,tA[1],tA[2],tA[3],isFast);
            }

            this.context.clearRect(0,0,this.canvas.width,this.canvas.height);
            this.context.putImageData(tempPsLib.imgData,0,0);//以临时对象data显示
            if(selector){
                //var alreadyCanvas = document.querySelector("#" + this.name);
                    document.querySelector(selector).appendChild(this.canvas);
            }else{
                document.body.appendChild(this.canvas);
            }

            return this;
        },

        replace: function(img){//替换原来的图片
            if(img){
                img.onload = function(){};
                img.src = this.save();
            }

            return this;
        },

        add: function(){//psLibObj,method,alpha,dx,dy,isFast,channel){合并一个psLibObj图层上去
            
            var numberArr = [],psLibObj,method,alpha,dx,dy,isFast,channel;
            for(var i = 0;i < arguments.length;i ++){
                if(!i) continue;

                switch(typeof(arguments[i])){
                    case "string":
                        if(/\d+%/.test(arguments[i])){//alpha
                            alpha = arguments[i].replace("%","");
                        }else if(/[RGB]+/.test(arguments[i])){//channel
                            channel = arguments[i];
                        }else{//method
                            method = arguments[i];
                        }
                    break;

                    case "number":
                        numberArr.push(arguments[i]);
                    break;

                    case "boolean":
                       isFast = arguments[i];
                    break;

                        
                }
            }

            dx = numberArr[0] || 0;
            dy = numberArr[1] || 0;
            method = method || "正常";
            alpha = alpha / 100 || 1;
            isFast = isFast || false;
            channel = channel || "RGB";

            psLibObj = arguments[0];

            this.imgData = P.add(this.imgData,psLibObj.imgData,method,alpha,dx,dy,isFast,channel);

            return this;
        },

        addLayer: function(psLibObj,method,dx,dy){//挂载一个图层上去，不会影响本身，只是显示有变化
            this.layers.push([psLibObj,method,dx,dy]);

            return this;
        },

        clone: function(){

            var tempPsLib = new window[Ps](this.canvas.width,this.canvas.height);
            tempPsLib.add(this);
            return tempPsLib;
        },

        swap: function(a,b){//交换a,b图层的顺序,ab代表当前序号
            var temp = this.layers[a];
            this.layers[a] = this.layers[b];
            this.layers[b] = temp;

            return this;
        },

        deleteLayers: function(arr){//删除几个图层序号
            this.layers = this.layers.del(arr);
        },

        save: function(isFast){//返回一个合成后的图像 png base64
            //创建一个临时的psLib对象，防止因为合并显示对本身imgData影响
            var tempPsLib = new window[Ps](this.canvas.width,this.canvas.height);
            tempPsLib.add(this,"正常",0,0,isFast);
            this.tempPsLib = tempPsLib;

            //将挂接到本对象上的图层对象 一起合并到临时的psLib对象上去 用于显示合并的结果，不会影响每个图层，包括本图层
            for(var i = 0;i < this.layers.length;i ++){
                var tA = this.layers[i];
                var layers = tA[0].layers;
                var currLayer = tA[0];
                if(layers[layers.length - 1] && layers[layers.length - 1][0].type == 1) currLayer = layers[layers.length - 1][0];
                tempPsLib.add(currLayer,tA[1],tA[2],tA[3],isFast);
            }

            this.context.clearRect(0,0,this.canvas.width,this.canvas.height);
            this.context.putImageData(tempPsLib.imgData,0,0);//以临时对象data显示

            return this.canvas.toDataURL(); 
        },

        drawRect: function(selector){//绘制直方图
            var canvas;
            if(canvas = document.getElementById("imgRect")){
            }else{
                canvas = document.createElement("canvas");
                canvas.id = "imgRect";
                document.body.appendChild(canvas);
                canvas.width = parseInt(this.canvas.width);
                canvas.height = parseInt(this.canvas.height);
            }
            var context = canvas.getContext("2d");
            context.clearRect(0,0,canvas.width,canvas.height);

            var result = [];
            var data = this.tempPsLib.imgData.data;
            for(var i = 0,n = data.length;i < n;i ++){
               if(!result[data[i]]){
                    result[data[i]] = 1;
               }else{
                    result[data[i]] ++;
               }
            }

            context.beginPath();
            context.moveTo(0,canvas.height);
            var max = 0;
            for(var i = 0;i < 255;i ++){
                if(result[i] > max) max = result[i];
            }

            for(var i = 0;i < 255;i ++){
                var currY = result[i] || 0;
                currY = canvas.height - currY / max * 0.8 * canvas.height;
                context.lineTo(i / 256 * canvas.width ,currY ,1,1); 
            }
            context.lineTo(canvas.width + 10,height);
            context.fill();
        },

        easy: function(effect){
            var fun = P.reflectEasy(effect);
            var _this = this;
            _this = fun.call(_this);
            return _this;
        }

    };

})("psLib");
/*
 * @author: Bin Wang
 * @description:灰度扩展
 *
 * */
;(function(Ps){

    window[Ps].module("ImageEnhance",function(P){

        var M = {
            process: function(imgData,arg1,arg2){
                var lamta = arg || 0.5;
                var data = imgData.data;
                var width = imgData.width;
                var height = imgData.height;
                var p1 = arg1 || {x: 10,y: 10};
                var p2 = arg2 || {x: 50,y: 40};

                function transfer(d){
                }

                for(var i = 0,n = data.length;i < n;i += 4){
                    
                }

                imgData.data = data;

                return imgData;
            }
        };

        return M;

    });

})("psLib");
/*
 * @author: Bin Wang
 * @description: Main add
 *
 * */
;(function(Ps){

    window[Ps].module("addLayer",function(P){

        var Add = {
            add: function(lowerData,upperData,method,alpha,dx,dy,isFast,channel){//isFast用于快速，适用于中间处理
                var l = lowerData.data;
                var u = upperData.data;
                dx = dx || 0;
                dy = dy || 0;
                alpha = alpha || 1;//alpha 范围为0 - 100
                isFast = isFast || false;

                channel = channel || "RGB";
                if(!(/[RGB]+/.test(channel))){
                    channel = "RGB";
                }
                //console.log(channel + "|" + alpha + "|" + dx + " " + dy + "|" + isFast);
                var channelString = channel.replace("R","0").replace("G","1").replace("B","2");
                //console.log(channelString);


                var jump = 1;
                if(isFast){
                   jump = 1; 
                }

                var result;

                for(var i = 0,n = l.length;i < n;i += 4 * jump){

                    var ii = i / 4,
                        width = lowerData.width;
                        height = lowerData.height;
                    var row = parseInt(ii / width); //得到当前点的坐标 y分量
                    var col = ii % width;

                    var uRow = row - dy;
                    var uCol = col - dx;

                    var uIi = uRow * upperData.width + uCol;
                    var uI = uIi * 4;

                    if(uI >= 0 && uI < (upperData.data.length - 4) && uCol < upperData.width && uCol >= 0){
                        //l[i + 3] = u[uI + 3];//透明度
                        for(var j = 0;j < 3;j ++){
                            if(u[uI + 3] == 0) break;//若此点透明则不计算
                            else l[i + 3] = u[uI + 3];
                            switch(method){
                                case "颜色减淡" :
                                    if(channelString.indexOf(j) > -1){
                                       result = l[i + j] + (l[i + j] * u[uI + j]) / (255 - u[uI + j]);
                                       l[i + j] = (1 - alpha) * l[i + j] + (alpha) * result;
                                    }
                                    break;

                                case "变暗":
                                    if(channelString.indexOf(j) > -1){
                                        result = l[i + j] < u[uI + j] ? l[i + j] : u[uI + j];
                                        l[i + j] = (1 - alpha) * l[i + j] + (alpha) * result;
                                    }
                                    break;

                                case "变亮":
                                    if(channelString.indexOf(j) > -1){
                                        result = l[i + j] > u[uI + j] ? l[i + j] : u[uI + j];
                                        l[i + j] = (1 - alpha) * l[i + j] + (alpha) * result;
                                    }
                                    break;

                                case "正片叠底":
                                    if(channelString.indexOf(j) > -1){
                                        result = parseInt((l[i + j] * u[uI + j]) / 255);
                                        l[i + j] = (1 - alpha) * l[i + j] + (alpha) * result;
                                    }
                                    break;

                                case "滤色" :
                                    if(channelString.indexOf(j) > -1){
                                        result = parseInt(255 - (255 - l[i + j]) * (255 - u[uI + j]) / 255);
                                        l[i + j] = (1 - alpha) * l[i + j] + (alpha) * result;
                                    }
                                    break;

                                case "叠加":
                                    if(channelString.indexOf(j) > -1){
                                        if(l[i + j] <= 127.5){
                                            result = l[i + j] * u[uI + j] / 127.5;
                                        }else{
                                            result = 255 - (255 - l[i + j]) * (255 - u[uI + j]) / 127.5;
                                        }
                                        l[i + j] = (1 - alpha) * l[i + j] + (alpha) * result;
                                    }
                                    break;

                                case "强光":
                                    if(channelString.indexOf(j) > -1){
                                        if(u[uI + j] <= 127.5){
                                            result = l[i + j] * u[uI + j] / 127.5;
                                        }else{
                                            result = l[i + j] + (255 - l[i + j]) * (u[uI + j] - 127.5) / 127.5;
                                        }
                                        l[i + j] = (1 - alpha) * l[i + j] + (alpha) * result;
                                    }
                                    break;

                                case "差值":
                                    if(channelString.indexOf(j) > -1){
                                        result = l[i + j] > u[uI + j] ? l[i + j] - u[uI + j] : u[uI + j] - l[i + j];
                                        l[i + j] = (1 - alpha) * l[i + j] + (alpha) * result;
                                    }
                                    break;

                                case "排除":
                                    if(channelString.indexOf(j) > -1){
                                        result = l[i + j] + u[uI + j] - (l[i + j] * u[uI + j]) / 127.5;
                                        l[i + j] = (1 - alpha) * l[i + j] + (alpha) * result;
                                    }
                                    break;

                                case "点光":
                                    if(channelString.indexOf(j) > -1){
                                        if(l[i + j] < (2 * u[uI + j] - 255)){
                                            result = 2 * u[uI + j] - 255;
                                        }else if(l[i + j] < 2 * u[uI + j]){
                                            result = l[i + j];
                                        }else{
                                            result = 2 * u[uI + j];    
                                        }
                                        l[i + j] = (1 - alpha) * l[i + j] + (alpha) * result;
                                    }
                                    break;

                                case "颜色加深":
                                    if(channelString.indexOf(j) > -1){
                                        result = 255 - 255 * (255 - l[i + j]) / u[uI + j];
                                        l[i + j] = (1 - alpha) * l[i + j] + (alpha) * result;
                                    }
                                    break;

                                case "线性加深":
                                    if(channelString.indexOf(j) > -1){
                                        var tempR = l[i + j] + u[uI + j];
                                        result = tempR > 255 ? tempR - 255 : 0;
                                        l[i + j] = (1 - alpha) * l[i + j] + (alpha) * result;
                                    }
                                    break;

                                case "线性减淡":
                                    if(channelString.indexOf(j) > -1){
                                        var tempR = l[i + j] + u[uI + j];
                                        result = tempR > 255 ? 255 : tempR;
                                        l[i + j] = (1 - alpha) * l[i + j] + (alpha) * result;
                                    }
                                    break;

                                case "柔光":
                                    if(channelString.indexOf(j) > -1){
                                        if(u[uI + j] < 127.5){
                                            result = ((2 * u[uI + j] - 255) * (255 - l[i + j]) / (255 * 255) + 1) * l[i + j];
                                        }else{
                                            result = (2 * u[uI + j] - 255) * (Math.sqrt(l[i + j] / 255) - l[i + j] / 255) + l[i + j];
                                        }
                                        l[i + j] = (1 - alpha) * l[i + j] + (alpha) * result;
                                    }
                                    break;

                                case "亮光":
                                    if(channelString.indexOf(j) > -1){
                                        if(u[uI + j] < 127.5){
                                            result = (1 - (255 - l[i + j]) / (2 * u[uI + j])) * 255;
                                        }else{
                                            result = l[i + j] / (2 * (1 - u[uI + j] / 255));
                                        }
                                        l[i + j] = (1 - alpha) * l[i + j] + (alpha) * result;
                                    }
                                    break;

                                case "线性光":
                                    if(channelString.indexOf(j) > -1){
                                        var tempR = l[i + j] + 2 * u[uI + j] - 255;
                                        result = tempR > 255 ? 255 : tempR;
                                        l[i + j] = (1 - alpha) * l[i + j] + (alpha) * result;
                                    }
                                    break;

                                case "实色混合":
                                    if(channelString.indexOf(j) > -1){
                                        if(u[uI + j] < (255 - l[i + j])){
                                            result = 0;
                                        }else{
                                            result = 255;
                                        }
                                        l[i + j] = (1 - alpha) * l[i + j] + (alpha) * result;
                                    }
                                    break;

                                default: 
                                    if(channelString.indexOf(j) > -1){
                                        result = u[uI + j];
                                        l[i + j] = (1 - alpha) * l[i + j] + (alpha) * result;
                                    }
                            }
                        }
                    }
                    
                }

                lowerData.data = l;

                return lowerData;
            }
        };

        return Add;

    });

})("psLib");
/*
 * @author: Bin Wang
 * @description: 调整RGB色调的值 
 *
 * */
;(function(Ps){

    window[Ps].module("alterRGB",function(P){

        var M = {
            process: function(imgData,args){//调节亮度对比度
                var data = imgData.data;
                var brightness = args[0] / 50;// -1,1
                var arg2 = args[1] || 0;
                var c = arg2 / 50;// -1,1
                var k = Math.tan((45 + 44 * c) * Math.PI / 180);//

                for(var i = 0,n = data.length;i < n;i += 4){
                    for(var j = 0;j < 3;j ++){
                        data[i + j] = (data[i + j] - 127.5 * (1 - brightness)) * k + 127.5 * (1 + brightness);
                    }
                }

                imgData.data = data;

                return imgData;
            }
        };

        return M;

    });

})("psLib");
/*
 * @author: Bin Wang
 * @description: 查找边缘
 *
 * */
;(function(Ps){

    window[Ps].module("applyMatrix",function(P){

        var M = {
            process: function(imgData,arg){
                var lamta = arg || 0.6;
                var data = imgData.data;
                var width = imgData.width;
                var height = imgData.height;
                var template = new P.lib.dorsyMath.Matrix([
                        -2,-4,-4,-4,-2,
                        -4,0,8,0,-4,
                        -4,8,24,8,-4,
                        -4,0,8,0,-4,
                        -2,-4,-4,-4,-2
                    ],25,1);                    
                var tempData = [];

                for(var i = 0,n = data.length;i < n;i += 4){
                    var ii = i / 4;
                    var row = parseInt(ii / width);
                    var col = ii % width;
                    if(row == 0 || col == 0) continue;

                    var pixelArr = [[],[],[]];
                    for(var k = -2;k < 3;k ++){
                        var currRow = row + k;

                        for(var kk = -2;kk < 3;kk ++){

                            var currCol = col + kk;
                            var currI = (currRow * width + currCol) * 4;

                            for(var j = 0;j < 3;j ++){
                                var tempI = currI + j; 
                                pixelArr[j].push(data[tempI]);
                            }

                        }

                    }

                    var pixelMatrix = new P.lib.dorsyMath.Matrix(pixelArr,3,matrixSize);
                    var resultMatrix = pixelMatrix.mutiply(template);

                    for(var j = 0;j < 3;j ++){
                       tempData[i + j] = resultMatrix.data[j]; 
                    }
                    tempData[i + 4] = data[i + 4];
                }
                for(var i = 0,n = data.length;i < n;i ++){
                    data[i] = tempData[i] || data[i];
                }

                return imgData;
            }
        };

        return M;

    });

})("psLib");
/*
 * @author: Bin Wang
 * @description: Main config
 *
 * */
;(function(Ps){

    window[Ps].module("config",function(P){

        var Reflection = {//记录映射关系
            "灰度处理": "toGray",
            "反色": "toReverse",
            "灰度阈值": "toThresh",
            "高斯模糊": "gaussBlur",
            "亮度": "alterRGB",
            "浮雕效果": "embossment",
            "查找边缘": "lapOfGauss",
            "色相/饱和度调节": "setHSI",
            "马赛克": "mosaic",
            "油画": "oilPainting",
            "腐蚀": "corrode",
            "锐化" : "sharp",
            "添加杂色" : "noise",
            "曲线" : "curve"
        };

        var EasyReflection = {
            "美肤" : "e1",
            "素描" : "e2",
            "自然增强" : "e3",
            "紫调" : "e4",
            "柔焦" : "e5",
            "复古" : "e6",
            "黑白" : "e7",
            "仿lomo" : "e8",
            "亮白增强" : "e9",
            "灰白" : "e10",
            "灰色" : "e11",
            "暖秋" : "e12",
        };

        var Config = {
            getModuleName: function(method){
                return Reflection[method] || method;
            },
            getEasyFun: function(effect){
                return EasyReflection[effect] || effect;
            }
        };

        return Config;

    });

})("psLib");
/*
 * @author: Bin Wang
 * @description:    腐蚀 
 *
 * */
;(function(Ps){

    window[Ps].module("corrode",function(P){

        var M = {
            process: function(imgData,arg){
                var R = parseInt(arg[0]) || 3;
                var data = imgData.data;
                var width = imgData.width;
                var height = imgData.height;
                var xLength = R * 2 + 1;

                //区块
                for(var x = 0;x < width;x ++){

                    for(var y = 0;y < height;y ++){
                        
                        var randomI = parseInt(Math.random() * R * 2) - R ;//区块随机代表
                        var randomJ = parseInt(Math.random() * R * 2) - R;//区块随机代表
                        var realI = y * width + x;
                        var realJ = (y + randomI) * width + x + randomJ;
                        for(var j = 0;j < 3;j ++){
                            data[realI * 4 + j] = data[realJ * 4 + j];
                        }

                    }

                }


                return imgData;
            }
        };

        return M;

    });

})("psLib");
/*
 * @author: Bin Wang
 * @description:    曲线 
 *
 * */
;(function(Ps){

    window[Ps].module("curve",function(P){

        var M = {
            process: function(imgData,arg){
                /*
                 * arg   arg[0] = [3,3] ,arg[1]  = [2,2]
                 * */

                var f = P.lib.dorsyMath.lagrange(arg[0], arg[1]);
                var data = imgData.data;
                var width = imgData.width;
                var height = imgData.height;
                //区块
                for(var x = 0;x < width;x ++){

                    for(var y = 0;y < height;y ++){
                        
                        var realI = y * width + x;
                        for(var j = 0;j < 3;j ++){
                            data[realI * 4 + j] = f(data[realI * 4 + j]);
                        }

                    }

                }


                return imgData;
            }
        };

        return M;

    });

})("psLib");
/*
 * @author: Bin Wang
 * @description:数学处理模块-core 
 * FFT 矩阵 复数 Langrange插值
 *
 * */
;(function(Ps){

    window[Ps].module("dorsyMath",function(P){

        
        var M = {
            FFT1: function(dataArr){
            /*
             * @description:快速傅里叶变换
             * @按时间抽取
             * */
                var size = dataArr.length;
                var count = 0;

                //------计算权重W------------
                var W = [];
                for(var i = 0;i < size;i ++){
                    W[i] = this.exp(-2 * Math.PI * i / size);
                }
                

                butterflyCal();
                return dataArr;

                function butterflyCal(){//蝶形运算单元
                    count ++;
                    var singleLength = size / Math.pow(2,count);//蝶形单元个数
                    var everyLength = size / singleLength;

                    for(var i = 0;i < singleLength;i ++){
                        singleButterflyCal(i * everyLength,(i + 1) * everyLength - 1,count);//逐次计算蝶形单元
                    }

                    if(singleLength > 1){//如果单元个数大于1继续运算
                        butterflyCal();//递归
                    }else{
                    }
                    
                }

                function singleButterflyCal(start,end,n){//一个蝶形单元 n运算次数 蝶形单元的成对间隔

                    var delta =  Math.pow(2,n - 1);
                    for(var i = start,j = 0;i <= (end - delta);i ++){
                        var pairI = i + delta;//i 的运算对
                        var currWeightForI = j * size / Math.pow(2,n);//计算i运算时的权重下标
                        var currWeightForPairI = currWeightForI + size / 4;//计算i的运算对时候的权重

                        if(!(dataArr[i] instanceof M.C)) dataArr[i] = new M.C(dataArr[i]);
                        if(!(dataArr[pairI] instanceof M.C)) dataArr[pairI] = new M.C(dataArr[pairI]);

                        var currResultForI = dataArr[i].plus(dataArr[pairI].mutiply(W[currWeightForI]));
                        var currResultForPairI = dataArr[i].plus(dataArr[pairI].mutiply(W[currWeightForPairI]));
                        dataArr[i] = currResultForI;
                        dataArr[pairI] = currResultForPairI;

                        j++;
                    }
                }

            },

            DFT: function(){
            /*
             * @description:离散傅里叶变换
             * */

            },

            Matrix: function(arr,arg,arg2){
            /*
             * @descriptiont:矩阵类
             * 构造一个矩阵,当然从原始的数据构造,但具有矩阵的所有基本运算方法
             * arr参数可以为矩阵,附加字符串参数为构造的行列如 ([0,0],"3*4")    或("构造3*4的1矩阵")  ("构造3*4的0矩阵")
             * */
                var resultArr = [];
                if(arg){
                    if(isNaN(arg)){
                        var m = /(\d+)\*/.exec(arg)[1];
                        var n = /\*(\d+)/.exec(arg)[1];
                    }else{
                        m = arg;
                        n = arg2;
                    }
                    
                    if(arr[0] && arr[0][0]){//本身二维的
                        for(var i = 0;i < m;i ++){
                            resultArr[i] = [];
                            for(var j = 0;j < n;j ++){
                                resultArr[i][j] = arr[i][j] || 0;
                            }
                        }
                    }else{//一维的
                        for(var i = 0;i < m;i ++){
                            resultArr[i] = [];
                            for(var j = 0;j < n;j ++){
                                var t = i * n + j;
                                resultArr[i][j] = arr[i * n + j] || 0;
                            }
                        }
                    }

                    this.m = m;
                    this.n = n;
                }else{
                    this.m = arr.length;
                    this.n = arr[0].length;
                }

                this.data = resultArr;


            },

            C: function(r,i){
            /*
             * @description:复数对象
             *
             * */
               this.r = r || 0;//实部
               this.i = i || 0;//虚部
            },

            exp: function(theta,r){//  r e^(i * theta) = r cos theta + r i * sin theta

                theta = theta || 0;
                r = r || 1;

                var tempC = new M.C();
                tempC.r = r * Math.cos(theta);
                tempC.i = r * Math.sin(theta);
                
                return tempC;
            },

            lagrange: function(xArr,yArr){
            /*
             * Lagrange插值
             * @usage   M.lagrange([1,2],[2,4])(3);
             * */
                var num = xArr.length;
                function getLk(x,k){//计算lk
                    var omigaXk = 1;
                    var omigaX = 1;
                    for(var i = 0;i < num;i ++){
                        if(i != k){
                            omigaXk *= xArr[k] - xArr[i];
                            omigaX *= x - xArr[i];
                        }
                    }
                    var lk = omigaX / omigaXk;
                    return lk;
                }
                var getY = function(x){
                    var L = 0;
                    for(var k = 0;k < num;k ++){
                        var lk = getLk(x,k);
                        L += yArr[k] * lk;

                    }
                    return L;
                };
                return getY;

            },

            applyMatrix: function(imgData,matrixArr,low){//对图象信号实行掩模算子变换 low为阈值,滤波运算

                low = low || 0;
                var data = imgData.data;
                var width = imgData.width;
                var height = imgData.height;
                var matrixSize = matrixArr.length;
                var template = new M.Matrix(matrixArr,matrixSize,1);                    
                var tempData = [];
                var start = -(Math.sqrt(matrixSize) - 1) / 2;

                for(var i = 0,n = data.length;i < n;i += 4){
                    var ii = i / 4;
                    var row = parseInt(ii / width);
                    var col = ii % width;
                    if(row == 0 || col == 0) continue;

                    var pixelArr = [[],[],[]];
                    for(var k = start;k <= -start;k ++){
                        var currRow = row + k;

                        for(var kk = start;kk <= -start;kk ++){

                            var currCol = col + kk;
                            var currI = (currRow * width + currCol) * 4;

                            for(var j = 0;j < 3;j ++){
                                var tempI = currI + j; 
                                pixelArr[j].push(data[tempI]);
                            }

                        }

                    }

                    var pixelMatrix = new P.lib.dorsyMath.Matrix(pixelArr,3,matrixSize);
                    var resultMatrix = pixelMatrix.mutiply(template);

                    for(var j = 0;j < 3;j ++){
                       tempData[i + j] = resultMatrix.data[j]; 
                    }
                    tempData[i + 4] = data[i + 4];
                }

                for(var i = 0,n = data.length;i < n;i ++){
                    if(tempData[i]){
                        data[i] = tempData[i] < low ? tempData[i] : data[i];
                    }
                }

                return imgData;
            },

            RGBToHSI: function(R,G,B){
                var theta = ((R - G + R - B) / 2) / Math.sqrt((R - G) * (R - G) + (R - B) * (G - B)) || 0;
                theta = Math.acos(theta);
                var H = B > G ? (2 * Math.PI - theta) : theta;
                var S = 1 - 3 * Math.min(R,G,B) / (R + G + B);
                var I = (R + G + B) / 3;

                if(H > 2 * Math.PI) H = 2 * Math.PI;
                if(H < 0) H = 0;

                return {
                    H: H,
                    S: S,
                    I: I
                };

            },

            HSIToRGB: function(H,S,I){//H为弧度值
                //H (-Math.PI , Math.PI)  S (-1,1) I (-255,255)
                if(H < 0){
                    H %= 2 * Math.PI;
                    H += 2 * Math.PI
                }else{
                    H %= 2 * Math.PI;
                }

                if(H <= Math.PI * 2 / 3){
                    var B = I * (1 - S);
                    var R = I * (1 + S * Math.cos(H) / Math.cos(Math.PI / 3 - H));
                    var G = 3 * I - (R + B);

                }else if(H <= Math.PI * 4 / 3){
                    H = H - Math.PI * 2 / 3;

                    var R = I * (1 - S);
                    var G = I * (1 + S * Math.cos(H) / Math.cos(Math.PI / 3 - H));
                    var B = 3 * I - (G + R);

                }else{
                    H = H - Math.PI * 4 / 3;

                    var G = I * (1 - S);
                    var B = I * (1 + S * Math.cos(H) / Math.cos(Math.PI / 3 - H));
                    var R = 3 * I - (G + B);

                }

                return {
                    R: R,
                    G: G,
                    B: B
                };
            },

            applyInHSI: function(imgData,func){//在hsi空间上应用func
                /*
                 * function(i){
                 *      i.H += 3;
                 * }
                 * H (-2*Math.PI , 2 * Math.PI)  S (-1,1) I (-255,255)
                 * */
                var data = imgData.data;
                for(var i = 0,n = data.length;i < n;i += 4){
                    var hsiObj = this.RGBToHSI(data[i],data[i + 1],data[i + 2]);
                    func(hsiObj);
                    if(hsiObj.S > 1) hsiObj.S = 1;
                    if(hsiObj.S < 0) hsiObj.S = 0;

                    var rgbObj = this.HSIToRGB(hsiObj.H,hsiObj.S,hsiObj.I);
                    data[i] = rgbObj.R;
                    data[i + 1] = rgbObj.G;
                    data[i + 2] = rgbObj.B;
                }
                
            },

            applyInCoordinate: function(imgData,func){//在坐标空间上应用func
                /*
                 * function(dot){
                 *      
                 * }
                 * */
            }
            
        };

        /*
        var t = M.RGBToHSI(255,5,25);
        var f = M.HSIToRGB(t.H+2 * Math.PI,t.S,t.I);
        alert(f.R + "|" + f.G + "|" + f.B);
        */

        M.Matrix.prototype = {
            /*m: 0,//数学上传统的m*n矩阵
            n: 0,
*/
            plus: function(matrix){
                if(this.m != matrix.m || this.n != matrix.n){
                    throw new Error("矩阵加法行列不匹配");
                }


                var tempM = new M.Matrix([],this.m,this.n);
                for(var i = 0;i < this.m;i ++){
                   for(var j = 0;j < this.n;j ++){
                        tempM.data[i][j] = this.data[i][j] + matrix.data[i][j];
                   }
                }
                return tempM;
            },

            minus: function(matrix){
                if(this.m != matrix.m || this.n != matrix.n){
                    throw new Error("矩阵减法法行列不匹配");
                }


                var tempM = new M.Matrix([],this.m,this.n);
                for(var i = 0;i < this.m;i ++){
                   for(var j = 0;j < this.n;j ++){
                        tempM.data[i][j] = this.data[i][j] - matrix.data[i][j];
                   }
                }
                return tempM;
            },

            mutiply: function(matrix){//左乘另一矩阵
                if(this.n != matrix.m){
                    throw new Error("矩阵乘法行列不匹配");
                }


                var tempM = new M.Matrix([],this.m,matrix.n);
                for(var i = 0;i < this.m;i ++){
                   for(var j = 0;j < matrix.n;j ++){

                        var sum = 0;
                        for(var ii = 0;ii < this.n;ii ++){
                            sum += this.data[i][ii] * matrix.data[ii][j];
                        }
                        tempM.data[i][j] = sum;
                   }
                }
                return tempM;

            }
        };

        M.C.prototype = {
            plus: function(c){
                var tempC = new M.C();
                tempC.r = this.r + c.r;
                tempC.i = this.i + c.i;

                return tempC;
            },
            minus:function(c){
                var tempC = new M.C();
                tempC.r = this.r - c.r;
                tempC.i = this.i - c.i;

                return tempC;
            },
            mutiply: function(c){
                var tempC = new M.C();
                tempC.r = this.r * c.r - this.i * c.i;
                tempC.i = this.r * c.i + this.i * c.r;

                return tempC;
            },
            divide: function(c){

                var tempC = new M.C();

                var m = c.mutiply(c.conjugated());
                var f = this.mutiply(c.conjugated());
                tempC.r = f.r / m.r;
                tempC.i = f.i / m.r;

                return tempC;
            },
            conjugated: function(){//取共轭
                var tempC = new M.C(this.r,-this.i);
                return tempC;
            }
        }
/*
    var l = new M.Matrix([1,1,2,3],2,2);
    var j = new M.Matrix([1,0,1,2],2,2);
    var t = l.mutiply(j);
    */
        return M;

    });

})("psLib");
/*
 * @author: Bin Wang
 * @description:    腐蚀 
 *
 * */
;(function(Ps){

    window[Ps].module("easy",function(P){

        var M = {
            getFun: function(fun){
                var Effects = {
                    e1: function(){//美肤
                        var _this = this.clone();
                        return  _this.add(
                            this.act("高斯模糊",10),"滤色"
                        ).act("亮度",-10,5);
                    },
                    e2: function(){//素描
                        var _this = this.act("灰度处理").clone();
                        return this.add(
                            _this.act("反色").act("高斯模糊",8), "颜色减淡"
                        ).act("锐化",1);
                    },
                    e3: function(){//自然增强
                      return this.act("曲线",[0,190,255],[0,229,255]);
                    },
                    e4: function(){
                        var _this = this.clone();
                        return this.add(
                            _this.act("高斯模糊",3), "正片叠底" ,"RG"
                        );
                        
                    },
                    e5: function(){
                        var _this = this.clone();
                        return this.add(
                            _this.act("高斯模糊",6), "变暗"
                        );
                    },
                    e6: function(){//复古
                        var _this = this.clone();
                        return this.act("灰度处理").add(
                            window[Ps](this.canvas.width,this.canvas.height,"#808080").act("添加杂色").act("高斯模糊",4).act("色相/饱和度调节",32,19,0,true),"叠加"
                        );
                    },
                    e7: function(){//黑白
                        return this.act("灰度处理");
                    },
                    e8: function(){//仿lomo
                        var m = this.clone().add(
                            this.clone() , "滤色"
                        ).add(
                            this.clone() , "柔光"
                        );

                        return m.add(
                            this.clone().act("反色") , "正常","20%","B"
                        );
                        
                    },
                    e9: function(){
                        return this.clone().add(
                            this.clone().act("曲线",[0,50,255],[0,234,255]), "柔光"
                        );
                    },
                    e10: function(){//高对比 灰白
                        return this.act("灰度处理").act("曲线",[0,61,69,212,255],[0,111,176,237,255]);
                    },
                    e11: function(){
                            return this.act("灰度处理").act("曲线",[0,60,142,194,255],[0,194,240,247,255])
                    },
                    e12: function(){
                        var m = this.clone().act("色相/饱和度调节",36,47,8,true);
                        return this.add(
                            m, "叠加"
                        );
                    }
                };

                return Effects[fun];
            }
        };

        return M;

    });

})("psLib");
/*
 * @author: Bin Wang
 * @description:  浮雕效果
 *
 * */
;(function(Ps){

    window[Ps].module("embossment",function(P){

        var M = {
            process: function(imgData,arg){//调节亮度对比度
                var data = imgData.data;
                var width = imgData.width;
                var height = imgData.height;

                var outData = [];
                for(var i = 0,n = data.length;i < n;i += 4){

                    var ii = i / 4;
                    var row = parseInt(ii / width);
                    var col = ii % width;
                    var A = ((row - 1) *  width + (col - 1)) * 4;
                    var G = (row + 1) * width * 4 + (col + 1) * 4;

                    if(row == 0 || col == 0) continue;
                    for(var j = 0;j < 3;j ++){
                        outData[i + j] = data[A + j] - data[G + j] + 127.5;
                    }
                    outData[i + 4] = data[i + 4];
                }

                for(var i = 0,n = data.length;i < n;i ++){
                    data[i] = outData[i] || data[i];
                }


                return imgData;
            }
        };

        return M;

    });

})("psLib");
/*
 * @author: Bin Wang
 * @description: 高斯模糊
 *
 * */
;(function(Ps){

    window[Ps].module("gaussBlur",function(P){

        var M = {

          /**
             * 高斯模糊
             * @param  {Array} pixes  pix array
             * @param  {Number} width 图片的宽度
             * @param  {Number} height 图片的高度
             * @param  {Number} radius 取样区域半径, 正数, 可选, 默认为 3.0
             * @param  {Number} sigma 标准方差, 可选, 默认取值为 radius / 3
             * @return {Array}
             */
            process: function(imgData,radius, sigma) {
                var pixes = imgData.data;
                var width = imgData.width;
                var height = imgData.height;
                var gaussMatrix = [],
                    gaussSum = 0,
                    x, y,
                    r, g, b, a,
                    i, j, k, len;


                radius = Math.floor(radius) || 3;
                sigma = sigma || radius / 3;
                
                a = 1 / (Math.sqrt(2 * Math.PI) * sigma);
                b = -1 / (2 * sigma * sigma);
                //生成高斯矩阵
                for (i = 0, x = -radius; x <= radius; x++, i++){
                    g = a * Math.exp(b * x * x);
                    gaussMatrix[i] = g;
                    gaussSum += g;
                
                }
                //归一化, 保证高斯矩阵的值在[0,1]之间
                for (i = 0, len = gaussMatrix.length; i < len; i++) {
                    gaussMatrix[i] /= gaussSum;
                }
                //x 方向一维高斯运算
                for (y = 0; y < height; y++) {
                    for (x = 0; x < width; x++) {
                        r = g = b = a = 0;
                        gaussSum = 0;
                        for(j = -radius; j <= radius; j++){
                            k = x + j;
                            if(k >= 0 && k < width){//确保 k 没超出 x 的范围
                                //r,g,b,a 四个一组
                                i = (y * width + k) * 4;
                                r += pixes[i] * gaussMatrix[j + radius];
                                g += pixes[i + 1] * gaussMatrix[j + radius];
                                b += pixes[i + 2] * gaussMatrix[j + radius];
                                // a += pixes[i + 3] * gaussMatrix[j];
                                gaussSum += gaussMatrix[j + radius];
                            }
                        }
                        i = (y * width + x) * 4;
                        // 除以 gaussSum 是为了消除处于边缘的像素, 高斯运算不足的问题
                        // console.log(gaussSum)
                        pixes[i] = r / gaussSum;
                        pixes[i + 1] = g / gaussSum;
                        pixes[i + 2] = b / gaussSum;
                        // pixes[i + 3] = a ;
                    }
                }
                //y 方向一维高斯运算
                for (x = 0; x < width; x++) {
                    for (y = 0; y < height; y++) {
                        r = g = b = a = 0;
                        gaussSum = 0;
                        for(j = -radius; j <= radius; j++){
                            k = y + j;
                            if(k >= 0 && k < height){//确保 k 没超出 y 的范围
                                i = (k * width + x) * 4;
                                r += pixes[i] * gaussMatrix[j + radius];
                                g += pixes[i + 1] * gaussMatrix[j + radius];
                                b += pixes[i + 2] * gaussMatrix[j + radius];
                                // a += pixes[i + 3] * gaussMatrix[j];
                                gaussSum += gaussMatrix[j + radius];
                            }
                        }
                        i = (y * width + x) * 4;
                        pixes[i] = r / gaussSum;
                        pixes[i + 1] = g / gaussSum;
                        pixes[i + 2] = b / gaussSum;
                        // pixes[i] = r ;
                        // pixes[i + 1] = g ;
                        // pixes[i + 2] = b ;
                        // pixes[i + 3] = a ;
                    }
                }
                //end
                imgData.data = pixes;
                return imgData;
            }
        };

        return M;

    });

})("psLib");
/*
 * @author: Bin Wang
 * @description: 查找边缘
 *
 * */
;(function(Ps){

    window[Ps].module("lapOfGauss",function(P){

        var M = {
            process: function(imgData,arg){
                var template1 = [
                    -2,-4,-4,-4,-2,
                    -4,0,8,0,-4,
                    -4,8,24,8,-4,
                    -4,0,8,0,-4,
                    -2,-4,-4,-4,-2
                ];
                var template2 = [
                        0,		1,		0,
						1,		-4,		1,
						0,		1,		0
                ];
                var template3 = [
                ];
                return P.lib.dorsyMath.applyMatrix(imgData,template1,250);
            }
        };

        return M;

    });

})("psLib");
/*
 * @author: Bin Wang
 * @description:  马赛克 
 *
 * */
;(function(Ps){

    window[Ps].module("mosaic",function(P){

        var M = {
            process: function(imgData,arg){//调节亮度对比度
                var R = parseInt(arg[0]) || 3;
                var data = imgData.data;
                var width = imgData.width;
                var height = imgData.height;
                var xLength = R * 2 + 1;

                for(var x = 0,n = parseInt(width / xLength);x < n;x ++){

                    for(var y = 0,m = parseInt(height / xLength);y < m;y ++){

                        var average = [],sum = [0,0,0];
                        for(var i = 0;i < xLength;i ++){

                            for(var j = 0;j < xLength;j ++){
                                var realI = (y * xLength + i) * width + x * xLength + j;
                                sum[0] += data[realI * 4];
                                sum[1] += data[realI * 4 + 1];
                                sum[2] += data[realI * 4 + 2];
                            }
                        }
                        average[0] = sum[0] / (xLength * xLength);
                        average[1] = sum[1] / (xLength * xLength);
                        average[2] = sum[2] / (xLength * xLength);

                        for(var i = 0;i < xLength;i ++){

                            for(var j = 0;j < xLength;j ++){
                                var realI = (y * xLength + i) * width + x * xLength + j;
                                data[realI * 4] = average[0];
                                data[realI * 4 + 1] = average[1];
                                data[realI * 4 + 2] = average[2];

                            }
                        }

                    }

                }


                return imgData;
            }
        };

        return M;

    });

})("psLib");
/*
 * @author: Bin Wang
 * @description:   添加杂色 
 *
 * */
;(function(Ps){

    window[Ps].module("noise",function(P){

        var M = {
            process: function(imgData,arg){
                var R = parseInt(arg[0]) || 100;
                var data = imgData.data;
                var width = imgData.width;
                var height = imgData.height;
                var xLength = R * 2 + 1;

                //区块
                for(var x = 0;x < width;x ++){

                    for(var y = 0;y < height;y ++){
                        
                        var realI = y * width + x;
                        for(var j = 0;j < 3;j ++){
                            var rand = parseInt(Math.random() * R * 2) - R;
                            data[realI * 4 + j] += rand;
                        }

                    }

                }


                return imgData;
            }
        };

        return M;

    });

})("psLib");
/*
 * @author: Bin Wang
 * @description: 油画 
 *
 * */
;(function(Ps){

    window[Ps].module("oilPainting",function(P){

        var M = {
            process: function(imgData,arg){
                var R = parseInt(arg[0]) || 16;
                var data = imgData.data;
                var width = imgData.width;
                var height = imgData.height;
                var xLength = R * 2 + 1;

                //区块
                for(var x = 0;x < width;x ++){

                    for(var y = 0;y < height;y ++){
                        
                        var realI = y * width + x;
                        var gray = 0;
                        for(var j = 0;j < 3;j ++){
                            gray += data[realI * 4 + j];
                        }
                        gray = gray / 3;
                        var every = parseInt(gray / R) * R;
                        for(var j = 0;j < 3;j ++){
                            data[realI * 4 + j] = every;
                        }
                    }

                }


                return imgData;
            }
        };

        return M;

    });

})("psLib");
/*
 * @author: Bin Wang
 * @description: 调整RGB 饱和和度  
 *H (-2*Math.PI , 2 * Math.PI)  S (-100,100) I (-100,100)
 * 着色原理  勾选着色后，所有的像素不管之前是什么色相，都变成当前设置的色相，然后饱和度变成现在设置的饱和度，但保持明度为原来的基础上加上设置的明度
 * */
;(function(Ps){

    window[Ps].module("setHSI",function(P){

        var M = {
            process: function(imgData,arg){//调节亮度对比度
                arg[0] = arg[0] / 180 * Math.PI;
                arg[1] = arg[1] / 100 || 0;
                arg[2] = arg[2] / 100 * 255 || 0;
                arg[3] = arg[3] || false;//着色

                P.lib.dorsyMath.applyInHSI(imgData,function(i){

                    if(arg[3]){
                        i.H = arg[0];
                        i.S = arg[1];
                        i.I += arg[2];
                    }else{
                        i.H += arg[0];
                        i.S += arg[1];
                        i.I += arg[2];
                    }

                });

                return imgData;
            }
        };

        return M;

    });

})("psLib");
/*
 * @author: Bin Wang
 * @description:锐化 
 *
 * */
;(function(Ps){

    window[Ps].module("sharp",function(P){

        var M = {
            process: function(imgData,arg){
                var lamta = arg[0] || 0.6;
                var data = imgData.data;
                var width = imgData.width;
                var height = imgData.height;

                for(var i = 0,n = data.length;i < n;i += 4){
                    var ii = i / 4;
                    var row = parseInt(ii / width);
                    var col = ii % width;
                    if(row == 0 || col == 0) continue;

                    var A = ((row - 1) *  width + (col - 1)) * 4;
                    var B = ((row - 1) * width + col) * 4;
                    var E = (ii - 1) * 4;

                    for(var j = 0;j < 3;j ++){
                        var delta = data[i + j] - (data[B + j] + data[E + j] + data[A + j]) / 3;
                        data[i + j] += delta * lamta;
                    }
                }

                return imgData;
            }
        };

        return M;

    });

})("psLib");
/*
 * @author: Bin Wang
 * @description: 灰度处理
 *
 * */
;(function(Ps){

    window[Ps].module("toGray",function(P){

        var M = {
            process: function(imgData){
                var data = imgData.data;

                for(var i = 0,n = data.length;i < n;i += 4){
                    var gray = parseInt((data[i] + data[i + 1] + data[i + 2]) / 3);
                    data[i + 2] = data[i + 1] = data[i] = gray;
                }

                imgData.data = data;

                return imgData;
            }
        };

        return M;

    });

})("psLib");
/*
 * @author: Bin Wang
 * @description: 反色
 *
 * */
;(function(Ps){

    window[Ps].module("toReverse",function(P){

        var M = {
            process: function(imgData){
                var data = imgData.data;

                for(var i = 0,n = data.length;i < n;i += 4){
                    data[i] = 255 - data[i];
                    data[i + 1] = 255 - data[i + 1];
                    data[i + 2] = 255 - data[i + 2];
                }

                imgData.data = data;

                return imgData;
            }
        };

        return M;

    });

})("psLib");
/*
 * @author: Bin Wang
 * @description:灰度阈值 做只有2级灰度图像处理 
 *
 * */
;(function(Ps){

    window[Ps].module("toThresh",function(P){

        var M = {
            process: function(imgData,arg){
                imgData = P.lib.toGray.process(imgData);
                var data = imgData.data;

                var arg = arg[0] || 128;
                for(var i = 0,n = data.length;i < n;i ++){
                    if((i + 1) % 4){
                        data[i] = data[i] > arg ? 255 : 0;
                    }
                }

                imgData.data = data;

                return imgData;
            }
        };

        return M;

    });

})("psLib");
