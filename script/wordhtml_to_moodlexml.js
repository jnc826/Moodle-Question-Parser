$(document).ready(function() { 
    
    var quizXMLString = '<?xml version="1.0" ?><quiz>#QUESTIONS#</quiz>';
    
    var questionXMLString = '<question type="#TYPE#">'
                            +'<name><text><![CDATA[#QNAME#]]></text></name>'
                            +'<questiontext format="html"><text><![CDATA[#QTEXT#]]></text></questiontext>'
                            +'#ANSWERS#'
                            +'#PARAMS#'
                            +'</question>';
                    
    var mcParamXMLString = '<shuffleanswers>#SHUFFLE#</shuffleanswers>'
                            +'<single>#SINGLE#</single>'
                            +'<answernumbering>#ANUMBERING#</answernumbering>'
                            +'<defaultgrade>#DEFAULTGRADE#</defaultgrade>';
                    
    var tfParamXMLString = '<defaultgrade>#DEFAULTGRADE#</defaultgrade>';
      
    var answerXMLString = '<answer fraction="#PERCENT#">'
                            +'<text><![CDATA[#ANSWERTEXT#]]></text>'
                            +'<feedback><text>#FEEDBACK#</text></feedback>'
                            +'</answer>';
    
    
    var collectionMC = new Array(); //MC kérdések tömbje
    var collectionTF = new Array(); //TF kérdések tömbje
    var collectionCQ = new Array(); //Cloze kérdések tömbje
    var collectionSA = new Array(); //SA kérdések tömbje
    
    function br2nl(str) {
        return str.replace(/<br\s*\/?>/mg,"\n");
    }
    
    /*
     * HTML karakterek átírása
     * @str {string} Átalakítandó karakterlánc
     * @returns {string} Átalakított karakterlánc
     */
    function htmlspecialchars(str) {
        if (typeof(str) == "string") {
            str = str.replace(/&/g, "&amp;"); /* must do &amp; first */
            str = str.replace(/"/g, "&quot;");
            str = str.replace(/'/g, "&#039;");
            str = str.replace(/</g, "&lt;");
            str = str.replace(/>/g, "&gt;");
	}
	return str;
    }

    /*
     * HTML karakterek átírása
     * @str {string} Átalakítandó karakterlánc
     * @returns {string} Átalakított karakterlánc
     */
    function rhtmlspecialchars(str) {
        if (typeof(str) == "string") {
            str = str.replace(/&gt;/ig, ">");
            str = str.replace(/&lt;/ig, "<");
            str = str.replace(/&#039;/g, "'");
            str = str.replace(/&quot;/ig, '"');
            str = str.replace(/&amp;/ig, '&'); /* must do &amp; last */
	}
	return str;
    }
	
	
	
    /*
     * Állomány kiterjesztésének megállapítása
     * @filename {string} Állománynév sztring formájában
     * @returns {RegExp} kigyűjtött kiterjesztés
     */
    function getFileExtension(filename) {
       return (/[.]/.exec(filename)) ? /[^.]+$/.exec(filename) : undefined;
    }
    
    /*
     * MC kérések gyűjteményének módosítása a felületen lévő űrlapelemek alapján.
     */
    function modifyMCCollection(){
        var errorList = {};
        //Kérdés alapértelemezett pontjának beállítása az űrlapról
        $("#MC-tab .MC_question_point .question_point").each(function(i){
            var question_point_item = $(this);
            var point = question_point_item.spinner("value");
            collectionMC[i].defaultGrade = point;
        });   
        var $mcTestQs = $("#MC-tab .MC_question_content"); //MC kérések lekérdezése
        //Végigmegyünk az össze kérdésen
        $mcTestQs.each(function(i) {
            var rAnswers = $(this).find(".MC_question_rightanswer_percent"); //megkeressük a kérdéshez tartozó helyes válaszokat
            var wAnswers = $(this).find(".MC_question_wronganswer_percent"); //megkeressük a kérdéshez tartozó helytelen válaszokat
            var sumRAnswer = 0;
            var sumWAnswer = 0;
            rAnswers.each(function(j){
                var percent = $(this).val(); //beolvassuk az egyes százalék értékeket
                collectionMC[i].rightAnswers[j].percent = percent;
                sumRAnswer += parseFloat(percent);
            });
            wAnswers.each(function(j){
                var percent = $(this).val(); //beolvassuk az egyes százalék értékeket
                collectionMC[i].wrongAnswers[j].percent = percent;
                sumWAnswer += parseFloat(percent);
            }); 
            
            //Ellenőrzés, hogy az adott kérdés összpontja eléri e a 100%-ot
            if(sumRAnswer <= 99.9 || sumRAnswer >= 100.1){
                $(this).addClass('ui-state-error'); //megjelölés, ha nem 100%
                errorList.not100 = "RA != 100"; //hiba hozzáadása a hiba objektumhoz
            }else{
                $(this).removeClass('ui-state-error'); //ha igen, akkor levesszük a stílust
            }
        });
        //ha van hiba (nem éri el a jó válaszok a 100%-ot, akkor hibaablak megjelenítése
        if(errorList.not100){
            $("#dialog").dialog("option", {title: strings.error}).html(strings.not100).dialog( "open" );
        }
    }
    
    /*
     * TF kérdésobjektum megváltoztatása
     */
    function modifyTFCollection(){
        //Kérdés alapértelemezett pontjának beállítása az űrlapról
        $("#TF-tab .TF_question_point .question_point").each(function(i){
            var question_point_item = $(this);
            var point = question_point_item.spinner("value");
            collectionTF[i].defaultGrade = point;
        });
    }
    
    //lenyíló listás megjelenítés biztosítása
    $( "#parserblock" ).accordion({
       collapsible: true,
       heightStyle: "content",
       disabled: true
    }); 
    //gombok ui-hoz igazítása
    $("#pointmethodbuttons").buttonset();
    $("input[type=submit], input[type=file]").button();
    $("button").button();
    //fülek ui-hoz
    $("#parserblock #tabs").tabs();
      //dialógus ablak paraméterei
    $( "#dialog" ).dialog({
      autoOpen: false,
      show: {
        effect: "blind",
        duration: 1000
      },
      hide: {
        effect: "blind",
        duration: 1000
      }
    });
    
    
    
    //mentés gomb uihoz, és kattintás eseémény 
    $("#save_param").button().click(function(evt) {
        modifyMCCollection(); //mentés esetén a MC objektum lista módosítása
        modifyTFCollection(); //mentés esetén a TF objektum lista módosítása
        writeXML(); //XML kód kiírása
    });
    
   //ha a fájlválasztóra kattintottak
    $("#filechoose").click(function(evt) {
        var file = document.getElementById('sourcefileinput').files[0];
        if(file && file.type == "text/html"){
            //állomány betöltése
            var reader = new FileReader();
            reader.onload = function(){
                var text = reader.result;
                //console.log(text);
                $("#sourcefile").html(text);
                parseHTML();
                $("#parserblock").accordion({
                    disabled: false,
                    active: 2
                });
            };
            reader.readAsText(file);
        }
    });
    
    //xml mentése
    $("#xmlsave").click(function(evt){
        var filename = "moodle_questions.xml";
        var xmltext = $("#xmlCode").text();
	var blob = new Blob([xmltext], {type: "text/plain;charset=utf-8"});
	saveAs(blob, filename);
    })
  
/* --------------------Kérdéssorok összeállítása, tömbként visszaadása --------------------------------------------------------*/  
  
    /*
     * MC kérdéssor összeállítása, tömbként visszaállítása
     */
    function getMCCollection(){
        var scoringMethod = $( "#pointmethodbuttons :radio:checked" ).attr('value'); //pontozási metódus
        
        console.log(scoringMethod);
        
        var listMC = new Array(); //MC kérdések tömbjének létrehozása
        
        var $mcTestQs = $("#sourcefile .Feleletvlasztskrds"); //MC kérések lekérdezése, 
        //Végigmegyünk az össze kérdésen
        $mcTestQs.each(function(i) {
            var questionText = $(this).html(); //kérdés szövege
            questionText = questionText.replace(/&nbsp;/g, ''); //felesleges bekezdéstörések kiszedése a kérdsés szövegéből

            var question = {};  //Kérdés objektum létrehozása
            question.type = (scoringMethod == "allornothing") ? "multichoiceset" :"multichoice";
            //question.type = "multichoice";
            question.name = "("+i+") "+questionText.substring(0,180); //kérdés neve = szövegével
            question.text = questionText; //kérdés szövege
            question.wrongAnswers = []; //rossz válaszok tömbje
            question.rightAnswers = []; //jó válaszok tömbje
//            question.rightAnswerPercent = []; //helyes válaszok százaléka alapértelmezésbe
//            question.wrongAnswerPercent = []; //helytelen válaszok százaléka alapértelmezésbe
            question.defaultGrade = 1; //alap pontérték a feladathoz
            
            //leválogatjuk az összes válaszelemet a következõ feletválasztós kérdésig
            var $qAnswers = $(this).nextUntil("#sourcefile .Feleletvlasztskrds");

            //a kapott eredményben végigmegyünk a rossz válaszokat kigyűjtjük a tömbbe
            $qAnswers.filter("#sourcefile .FeleletvlasztsROSSZ").each(function() {
                if($.trim($(this).text()) != "") { //ha nem üres, akkor rakja be
                    var wrongAnswer = $(this).html();
                    wrongAnswer.replace(/&nbsp;/g, ''); //felesleges bekezdéstörések kiszedése a rossz válaszból
                    var wA = {};
                    wA.text = wrongAnswer;
                    wA.percent = 0;
                    question.wrongAnswers.push(wA); //rossz válasz hozzáadása a rosszválasz tömbhöz
                }
            });
            //a kapott eredményben végigmegyünk a jó válaszokat kigyűjtjük a tömbbe
            $qAnswers.filter("#sourcefile .FeleletvlasztsHELYES").each(function() {
                if($.trim($(this).text()) != "") {//ha nem üres, akkor rakja be
                    var rightAnswer = $(this).html();
                    rightAnswer.replace(/&nbsp;/g, ''); //felesleges bekezdéstörések kiszedése a jó válaszból
                    var rA = {};
                    rA.text = rightAnswer;
                    rA.percent = 0; 
                    question.rightAnswers.push(rA); //jó válasz hozzáadása a rosszválasz tömbhöz
                }
            });
            
            var rightAnswerNumber = question.rightAnswers.length; //helyes válaszok száma
            var wrongAnswerNumber = question.wrongAnswers.length; //helytelen válaszok száma
            
            //Helyes válaszok kérdéspontok igazítása a lenyíló listákhoz. (Csak 10 darab válaszig oké)
            var rPercent = 0;
            switch (Math.floor(rightAnswerNumber)) {
                case 3:
                    rPercent = 33.333;
                    break;
                case 6:
                    rPercent = 16.666;
                    break;
                case 7:
                    rPercent = 14.2857;
                    break;
                case 8:
                    rPercent = 12.5;
                    break;
                case 9:
                    rPercent = 11.111;
                    break;
                default:
                    rPercent = 100/rightAnswerNumber;
            }
            for(i = 0; i < question.rightAnswers.length; i++) {
                question.rightAnswers[i].percent = (scoringMethod == "allornothing") ? 100 : rPercent;
            }

            //Helytelen válaszok kérdéspontok igazítása a lenyíló listákhoz. (Csak 10 darab válaszig oké)
            var wPercent = 0;
            if (scoringMethod == "strict") {
                switch (Math.floor(wrongAnswerNumber)) {
                    case 3:
                        wPercent = -33.333;
                        break;
                    case 6:
                        wPercent = -16.666;
                        break;
                    case 7:
                        wPercent = -14.2857;
                        break;
                    case 8:
                        wPercent = -12.5;
                        break;
                    case 9:
                        wPercent = -11.111;
                        break;
                    default:
                        wPercent = -100/wrongAnswerNumber;
                }
            }else{
                wPercent = 0;
            }
            for(i = 0; i < question.wrongAnswers.length; i++) {
                question.wrongAnswers[i].percent = wPercent;
            }
            
            listMC.push(question);
        });
        return listMC;
    }
    
    /*
     * TF kérdéssor összeállítása, tömbként visszaállítása
     */
    function getTFCollection(){
        var listTF = new Array(); //TF kérdések tömbjének létrehozása
        
        var $trueTestQs = $("#sourcefile .lltsIGAZ"); //Igaz állítások kigyűjtése
        var $falseTestQs = $("#sourcefile .lltsHAMIS"); //Hamis állítások kigyűjtése
        
        $trueTestQs.each(function(i) {
            var questionText = $(this).html(); //kérdés szövege
            questionText =  questionText.replace(/&nbsp;/g, ''); //felesleges bekezdéstörések kiszedése a kérsés szövegéből
            var question = {};  //Kérdés objektum létrehozása
            question.type = "truefalse";
            question.name = "("+i+") "+questionText.substring(0,180); //kérdés neve = szövegével
            question.text = questionText; //kérdés szövege
            question.answer = "true"; // Helyes válasz
			question.defaultGrade = 1; //alap pontérték a feladathoz
            listTF.push(question);
        });
        $falseTestQs.each(function(i) {
            var questionText = $(this).html(); //kérdés szövege
            questionText =  questionText.replace(/&nbsp;/g, ''); //felesleges bekezdéstörések kiszedése a kérdsés szövegéből
            var question = {};  //Kérdés objektum létrehozása
            question.type = "truefalse";
            question.name = "("+i+") "+questionText.substring(0,180); //kérdés neve = szövegével
            question.text = questionText; //kérdés szövege
            question.answer = "false"; // Helyes válasz
			question.defaultGrade = 1; //alap pontérték a feladathoz
            listTF.push(question);
        });
        return listTF;
    }
    
    /*
     * CQ kérdéssor összeállítása, tömbként visszaállítása
     */
    function getCQCollection(){
        var listCQ = new Array(); //CQ kérdések tömbjének létrehozása
        
        var $clozeQs = $("#sourcefile .Hinyosszvegbekezds"); //Igaz állítások kigyűjtése
        
        $clozeQs.each(function(i){
            var questionText = $(this).html(); //kérdés szövege
            //var questionText = $(this).text(); //kérdés szövege
            questionText = questionText.replace(/<span class="Hinyzsz">/g, '{1:SHORTANSWER:%100%');
            questionText = questionText.replace(/<[/]span>/g, '}');
            var question = {};  //Kérdés objektum létrehozása
            question.type = "cloze";
            question.name = "("+i+") "+questionText.substring(0,180); //kérdés neve = szövegével
            question.text = questionText; //kérdés szövege
            listCQ.push(question);
        })
        return listCQ;
    }
    /*
     * SA kérdéssor összeállítása, tömbként visszaállítása
     */
    function getSACollection(){
        var listSA = new Array(); //CQ kérdések tömbjének létrehozása
            
        var $saTestQs = $("#sourcefile .KiegsztendKRDS"); //MC kérések lekérdezése, 
        //Végigmegyünk az össze kérdésen
        $saTestQs.each(function(i) {
            var questionText = $(this).html();
            var question = {};  //Kérdés objektum létrehozása
            question.type = "shortanswer";
            question.name = "("+i+") "+questionText.substring(0,180); //kérdés neve = szövegével
            question.text = questionText; //kérdés szövege
            question.rightAnswers = []; //jó válaszok tömbje
            
            //leválogatjuk az összes válaszelemet a következõ feletválasztós kérdésig
            var $qAnswers = $(this).nextUntil("#sourcefile .KiegsztendKRDS");

            //a kapott eredményben végigmegyünk, a válaszokat kigyűjtjük a tömbbe
            $qAnswers.filter("#sourcefile .KiegsztendVLASZ").each(function() {
                if($.trim($(this).text()) != "") {//ha nem üres, akkor rakja be
                    var rightAnswer = $(this).text();
                    rightAnswer = rightAnswer.replace(/&nbsp;/g, ''); //felesleges bekezdéstörések kiszedése a jó válaszból
                    rightAnswer = rightAnswer.replace(/„/g, '"'); //felesleges bekezdéstörések kiszedése a jó válaszból
                    rightAnswer = rightAnswer.replace(/”/g, '"'); //felesleges bekezdéstörések kiszedése a jó válaszból
                    var rA = {};
                    rA.text = rightAnswer;
                    rA.percent = 100; 
                    question.rightAnswers.push(rA); //jó válasz hozzáadása a jóválasz tömbhöz
                }
            });
                        
            listSA.push(question);
            
            console.log(listSA);
            
        });
        
        return listSA;
    }
    
    
    /*----  HTML-esítés ----------------------------------------------------------------------------------------------------------------------------*/
    
    /*
     * MC kérdéssor tömbjéből a megjelenítendő string összeállítása
     */
    function getMCHTML(collMC){
        var selectmenuoptions = "";
        selectmenuoptions += '<option value="100">100%</option>';
        selectmenuoptions += '<option value="90">90%</option>';
        selectmenuoptions += '<option value="83.333">83.333%</option>';
        selectmenuoptions += '<option value="80">80%</option>';
        selectmenuoptions += '<option value="75">75%</option>';
        selectmenuoptions += '<option value="70">70%</option>';
        selectmenuoptions += '<option value="66.666">66.666%</option>';
        selectmenuoptions += '<option value="60">60%</option>';
        selectmenuoptions += '<option value="50">50%</option>';
        selectmenuoptions += '<option value="40">40%</option>';
        selectmenuoptions += '<option value="33.333">33.333%</option>';
        selectmenuoptions += '<option value="30">30%</option>';
        selectmenuoptions += '<option value="25">25%</option>';
        selectmenuoptions += '<option value="20">20%</option>';
        selectmenuoptions += '<option value="16.666">16.666%</option>';
        selectmenuoptions += '<option value="14.2857">14.2857%</option>';
        selectmenuoptions += '<option value="12.5">12.5%</option>';
        selectmenuoptions += '<option value="11.111">11.111%</option>';
        selectmenuoptions += '<option value="10">10%</option>';
        selectmenuoptions += '<option value="5">5%</option>';
        selectmenuoptions += '<option value="0">0</option>';
        selectmenuoptions += '<option value="-5">-5%</option>';
        selectmenuoptions += '<option value="-10">-10%</option>';
        selectmenuoptions += '<option value="-11.111">-11.111%</option>';
        selectmenuoptions += '<option value="-12.5">-12.5%</option>';
        selectmenuoptions += '<option value="-14.2857">-14.2857%</option>';
        selectmenuoptions += '<option value="-16.666">-16.666%</option>';
        selectmenuoptions += '<option value="-20">-20%</option>';
        selectmenuoptions += '<option value="-25">-25%</option>';
        selectmenuoptions += '<option value="-30">-30%</option>';
        selectmenuoptions += '<option value="-33.333">-33.333%</option>';
        selectmenuoptions += '<option value="-40">-40%</option>';
        selectmenuoptions += '<option value="-50">-50%</option>';
        selectmenuoptions += '<option value="-60">-60%</option>';
        selectmenuoptions += '<option value="-66.666">-66.666%</option>';
        selectmenuoptions += '<option value="-70">-70%</option>';
        selectmenuoptions += '<option value="-75">-75%</option>';
        selectmenuoptions += '<option value="-80">-80%</option>';
        selectmenuoptions += '<option value="-83.333">-83.333%</option>';
        selectmenuoptions += '<option value="-90">-90%</option>';
        selectmenuoptions += '<option value="-100">-100%</option>';

        var MC_HTML = "";
        for(i = 0; i < collMC.length; i++) {
            MC_HTML += "<div class=\"MC_question\">";
            MC_HTML += "<div class=\"MC_question_point\"><input class=\"question_point\" name=\"point\" value=\"1\"></div>";
            MC_HTML += "<div class=\"MC_question_content\">";
            MC_HTML += "<p class=\"MC_question_text\">"+collMC[i].text+"</p>";
            for(j=0; j<collMC[i].rightAnswers.length; j++){
                var answerID = "rightanswer_"+i+"_"+j;
                var actualselecmenuoptions = selectmenuoptions;
                var searchvalue = 'value="'+collMC[i].rightAnswers[j].percent+'"';
                var newvalue = 'value="'+collMC[i].rightAnswers[j].percent+'" selected="selected"';
                actualselecmenuoptions = actualselecmenuoptions.replace(searchvalue, newvalue);
                MC_HTML += "<p>";
                MC_HTML += '<select class="MC_question_rightanswer_percent" id="'+answerID+'">';
                MC_HTML += actualselecmenuoptions;
                MC_HTML += '</select>';
                MC_HTML += "<span class=\"MC_question_rightanswer\">"+collMC[i].rightAnswers[j].text+"</span>";
                MC_HTML += "</p>";
            }
            for(j=0; j<collMC[i].wrongAnswers.length; j++){
                var answerID = "wronganswer_"+i+"_"+j;
                var actualselecmenuoptions = selectmenuoptions;
                var searchvalue = 'value="'+collMC[i].wrongAnswers[j].percent+'"';
                var newvalue = 'value="'+collMC[i].wrongAnswers[j].percentt+'" selected="selected"';
                actualselecmenuoptions = actualselecmenuoptions.replace(searchvalue, newvalue);
                MC_HTML += "<p>";
                MC_HTML += '<select class="MC_question_wronganswer_percent" id="'+answerID+'">';
                MC_HTML += actualselecmenuoptions;
                MC_HTML += '</select>';
                //MC_HTML += "<input class=\"question_answer_percent\" name=\"answerpercent\" value=\""+collMC[i].wrongAnswerPercent+"\">";
                MC_HTML += "<span class=\"MC_question_wronganswer\">"+collMC[i].wrongAnswers[j].text+"</span>";
                MC_HTML += "</p>";
            }
            MC_HTML += "</div>";
            MC_HTML += "</div>";
        }
        MC_HTML += "<div class=\"lastline\"></div>";;
        return MC_HTML;
    }
    
    /*
     * TF kérdéssor tömbjéből a megjelenítendő string összeállítása
     */
    function getTFHTML(collTF){
        var TF_HTML = "";
        for(i = 0; i < collTF.length; i++) {
            TF_HTML += "<div class=\"TF_question\">";
            TF_HTML += "<div class=\"TF_question_point\"><input class=\"question_point\" name=\"point\" value=\"1\"></div>";
            TF_HTML += "<div class=\"TF_question_content\">";
            if(collTF[i].answer == "true") {
                TF_HTML += "<p class=\"TF_question_true\">"+collTF[i].text+"</p>";
            }else{
                TF_HTML += "<p class=\"TF_question_false\">"+collTF[i].text+"</p>";
            }
            TF_HTML += "</div>";
            TF_HTML += "</div>";
        }
        TF_HTML += "<div class=\"lastline\"></div>";
        return TF_HTML;
    }

    function getCQHTML(collCQ){
        var CQ_HTML = "";
        for(i = 0; i < collCQ.length; i++) {
            CQ_HTML += "<div class=\"CQ_question\">";
            CQ_HTML += "<div class=\"CQ_question_point\"><input class=\"question_point\" name=\"point\" value=\"1\"></div>";
            CQ_HTML += "<div class=\"CQ_question_content\">";
            CQ_HTML += "<p class=\"CQ_question_text\">"+collCQ[i].text+"</p>";
            CQ_HTML += "</div>";
            CQ_HTML += "</div>";
        }
        CQ_HTML += "<div class=\"lastline\"></div>";
        return CQ_HTML;
    }
    
    function getSAHTML(collSA){
        var SA_HTML = "";
        for(i = 0; i < collSA.length; i++) {
            SA_HTML += "<div class=\"SA_question\">";
            SA_HTML += "<div class=\"SA_question_point\"><input class=\"question_point\" name=\"point\" value=\"1\"></div>";
            SA_HTML += "<div class=\"SA_question_content\">";
            SA_HTML += "<p class=\"SA_question_text\">"+collSA[i].text+"</p>";
            for(j=0; j<collSA[i].rightAnswers.length; j++){
                SA_HTML += "<p>";
                SA_HTML += "<span class=\"SA_question_rightanswer\">"+collSA[i].rightAnswers[j].text+"</span>";
                SA_HTML += "</p>";
            }
            
            
            SA_HTML += "</div>";
            SA_HTML += "</div>";
        }
        SA_HTML += "<div class=\"lastline\"></div>";
        return SA_HTML;
    }

    
/* --------------- Parszálások --------------------------------------------------------------------------------------- */    
    /*
     * Beolvasott HTML értelmezése
     */
    function parseHTML(){
        collectionMC = getMCCollection(); //MC kérdéstömb lekérése
        collectionTF = getTFCollection(); //TF kérdéstömb lekérése
        collectionCQ = getCQCollection(); //CQ kérdéstömb lekérdezése
        collectionSA = getSACollection(); //SA kérdéstömb lekérdezése
               
        $("#MC-tab").html(getMCHTML(collectionMC));
        $("#TF-tab").html(getTFHTML(collectionTF));
        $("#CQ-tab").html(getCQHTML(collectionCQ));
        $("#SA-tab").html(getSAHTML(collectionSA));

        $(".question_point").spinner({
            min: 1,
            max: 100
        });
        
        //$("select").selectmenu();
       // $(".question_answer_percent").selectmenu( "menuWidget" ).addClass( "overflow" );
        
        writeXML();
    }
    
    /*
     * MC objektumlista feldolgozása XML formára
     */
    function parseMC(){
        var currentQuestionsXMLSting = '';

        for(var i=0; i<collectionMC.length; i++){
            //Adott kérdés paraméterezése a sablon alapján
            var currentQuestionXMLString = questionXMLString;
            currentQuestionXMLString = currentQuestionXMLString.replace("#TYPE#", collectionMC[i].type);
            currentQuestionXMLString = currentQuestionXMLString.replace("#QNAME#", collectionMC[i].name);
            currentQuestionXMLString = currentQuestionXMLString.replace("#QTEXT#", collectionMC[i].text);
            var currentAnswersXMLString = '';  //Válaszok xml üresre
            var currentParamXMLString = ''; //Paraméterek xml üresre
            //Helyes válaszok felvétele
            for (var j=0; j < collectionMC[i].rightAnswers.length; j++){
                var currentAnswerXMLString = answerXMLString;
                currentAnswerXMLString = currentAnswerXMLString.replace("#ANSWERTEXT#", collectionMC[i].rightAnswers[j].text);
                currentAnswerXMLString = currentAnswerXMLString.replace("#FEEDBACK#", strings.rightfeedback);
                currentAnswerXMLString = currentAnswerXMLString.replace("#PERCENT#", collectionMC[i].rightAnswers[j].percent);
                currentAnswersXMLString += currentAnswerXMLString;
            }
            //Helytelen válaszok felvétele
            for (var j=0; j < collectionMC[i].wrongAnswers.length; j++){
                var currentAnswerXMLString = answerXMLString;
                currentAnswerXMLString = currentAnswerXMLString.replace("#ANSWERTEXT#", collectionMC[i].wrongAnswers[j].text);
                currentAnswerXMLString = currentAnswerXMLString.replace("#FEEDBACK#", strings.wrongfeedback);
                currentAnswerXMLString = currentAnswerXMLString.replace("#PERCENT#", collectionMC[i].wrongAnswers[j].percent );
                currentAnswersXMLString += currentAnswerXMLString;
            }
            
            //Kiegészítő paraméterek felvétele
            currentParamXMLString = mcParamXMLString;
            currentParamXMLString = currentParamXMLString.replace("#SHUFFLE#", 1);
            currentParamXMLString = currentParamXMLString.replace("#SINGLE#", collectionMC[i].rightAnswers.length == 1 ? "true" : "false");
            currentParamXMLString = currentParamXMLString.replace("#ANUMBERING#", "none");
            currentParamXMLString = currentParamXMLString.replace("#DEFAULTGRADE#", collectionMC[i].defaultGrade);
            
            //Kérdések xml szakasz hozzásadása a teljes mintához
            currentQuestionXMLString = currentQuestionXMLString.replace("#ANSWERS#", currentAnswersXMLString);
            //Paraméterek xml szakasz hozzásadása a teljes mintához
            currentQuestionXMLString = currentQuestionXMLString.replace("#PARAMS#", currentParamXMLString);
            //Összes kérdés összerakása
            currentQuestionsXMLSting += currentQuestionXMLString;
        }
        return currentQuestionsXMLSting;
    }
    /*
     * TF objektumlista feldolgozása XML formára
     */
    function parseTF(){
        var currentQuestionsXMLSting = '';
        
        //Álítások felvétele
        for (var i=0; i < collectionTF.length; i++){
            //Adott kérdés paraméterezése a sablon alapján
            var currentQuestionXMLString = questionXMLString;
            currentQuestionXMLString = currentQuestionXMLString.replace("#TYPE#", collectionTF[i].type);
            currentQuestionXMLString = currentQuestionXMLString.replace("#QNAME#", collectionTF[i].name);
            currentQuestionXMLString = currentQuestionXMLString.replace("#QTEXT#", collectionTF[i].text);
            var currentAnswersXMLString = '';  //Válaszok xml üresre
            var currentParamXMLString = ''; //Paraméterek xml üresre
            var currentAnswerXMLString1 = answerXMLString;
            var currentAnswerXMLString2 = answerXMLString;
            if(collectionTF[i].answer == "true") {
                currentAnswerXMLString1 = currentAnswerXMLString1.replace("#ANSWERTEXT#", "true");
                currentAnswerXMLString1 = currentAnswerXMLString1.replace("#FEEDBACK#", strings.rightfeedback);
                currentAnswerXMLString1 = currentAnswerXMLString1.replace("#PERCENT#", "100");
                currentAnswerXMLString2 = currentAnswerXMLString2.replace("#ANSWERTEXT#", "false");
                currentAnswerXMLString2 = currentAnswerXMLString2.replace("#FEEDBACK#", strings.wrongfeedback);
                currentAnswerXMLString2 = currentAnswerXMLString2.replace("#PERCENT#", "0");   
            }else{
                currentAnswerXMLString1 = currentAnswerXMLString1.replace("#ANSWERTEXT#", "true");
                currentAnswerXMLString1 = currentAnswerXMLString1.replace("#FEEDBACK#", strings.wrongfeedback);
                currentAnswerXMLString1 = currentAnswerXMLString1.replace("#PERCENT#", "0");
                currentAnswerXMLString2 = currentAnswerXMLString2.replace("#ANSWERTEXT#", "false");
                currentAnswerXMLString2 = currentAnswerXMLString2.replace("#FEEDBACK#", strings.rightfeedback);
                currentAnswerXMLString2 = currentAnswerXMLString2.replace("#PERCENT#", "100"); 
            }
            //Kiegészítő paraméterek felvétele
            currentParamXMLString = tfParamXMLString;
            currentParamXMLString = currentParamXMLString.replace("#DEFAULTGRADE#", collectionTF[i].defaultGrade);
            
            //Kérdések xml szakasz hozzásadása a teljes mintához
            currentQuestionXMLString = currentQuestionXMLString.replace("#ANSWERS#", currentAnswerXMLString1+currentAnswerXMLString2);
            //Paraméterek xml szakasz hozzásadása a teljes mintához
            currentQuestionXMLString = currentQuestionXMLString.replace("#PARAMS#", currentParamXMLString);
            //Összes kérdés összerakása
            currentQuestionsXMLSting += currentQuestionXMLString;
        }
        return currentQuestionsXMLSting;
    }
    
    function parseCQ(){
        var currentQuestionsXMLSting = '';
        
        //Álítások felvétele
        for (var i=0; i < collectionCQ.length; i++){
            //Adott kérdés paraméterezése a sablon alapján
            var currentQuestionXMLString = questionXMLString;
            currentQuestionXMLString = currentQuestionXMLString.replace("#TYPE#", collectionCQ[i].type);
            currentQuestionXMLString = currentQuestionXMLString.replace("#QNAME#", collectionCQ[i].name);
            currentQuestionXMLString = currentQuestionXMLString.replace("#QTEXT#", collectionCQ[i].text);
            
            //Kérdések xml szakasz hozzásadása a teljes mintához
            currentQuestionXMLString = currentQuestionXMLString.replace("#ANSWERS#", "");
            //Paraméterek xml szakasz hozzásadása a teljes mintához
            currentQuestionXMLString = currentQuestionXMLString.replace("#PARAMS#", "");
            
            currentQuestionsXMLSting += currentQuestionXMLString;
        }
        return currentQuestionsXMLSting;
    }
    
    function parseSA(){
        var currentQuestionsXMLSting = '';

        for(var i=0; i<collectionSA.length; i++){
            //Adott kérdés paraméterezése a sablon alapján
            var currentQuestionXMLString = questionXMLString;
            currentQuestionXMLString = currentQuestionXMLString.replace("#TYPE#", collectionSA[i].type);
            currentQuestionXMLString = currentQuestionXMLString.replace("#QNAME#", collectionSA[i].name);
            currentQuestionXMLString = currentQuestionXMLString.replace("#QTEXT#", collectionSA[i].text);
            var currentAnswersXMLString = '';  //Válaszok xml üresre
            var currentParamXMLString = ''; //Paraméterek xml üresre
            //Helyes válaszok felvétele
            for (var j=0; j < collectionSA[i].rightAnswers.length; j++){
                var currentAnswerXMLString = answerXMLString;
                currentAnswerXMLString = currentAnswerXMLString.replace("#ANSWERTEXT#", collectionSA[i].rightAnswers[j].text);
                currentAnswerXMLString = currentAnswerXMLString.replace("#FEEDBACK#", strings.rightfeedback);
                currentAnswerXMLString = currentAnswerXMLString.replace("#PERCENT#", collectionSA[i].rightAnswers[j].percent);
                currentAnswersXMLString += currentAnswerXMLString;
            }
            
            //Kérdések xml szakasz hozzásadása a teljes mintához
            currentQuestionXMLString = currentQuestionXMLString.replace("#ANSWERS#", currentAnswersXMLString);
            //Paraméterek xml szakasz hozzásadása a teljes mintához
            currentQuestionXMLString = currentQuestionXMLString.replace("#PARAMS#", currentParamXMLString);
            //Összes kérdés összerakása
            currentQuestionsXMLSting += currentQuestionXMLString;
        }
        return currentQuestionsXMLSting;
    }
  
    
    
    /*
     * XML kód összeállítása
     */
    function writeXML(){
        var allQuestionString = ''; //Összes kérdés sztringje
        var mcQuestions = parseMC(); //MC kérdések sztringje
        var tfQuestions = parseTF(); //TF kérdések sztringje
        var cqQuestions = parseCQ(); //CQ kérdések sztringje;
        var saQuestions = parseSA(); //CQ kérdések sztringje;
        
        //Összes kérdésszting összerakása
        if (mcQuestions) allQuestionString += mcQuestions;
        if (tfQuestions) allQuestionString += tfQuestions;
        if (cqQuestions) allQuestionString += cqQuestions;
        if (saQuestions) allQuestionString += saQuestions;
        
        //Végleges xmlsztring összerakása
        var currentQuizXMLString = quizXMLString;
        currentQuizXMLString =  currentQuizXMLString.replace("#QUESTIONS#",  allQuestionString);
        
        currentQuizXMLString = currentQuizXMLString.replace(/[\n\r]/g, ' ');
               
        //végső xml kirakása a szövegdobozba
        $("#xmlCode").text(currentQuizXMLString);
    }
	
	
	


});

