$(document).ready(function() { 
    
    var quizXMLString = '<?xml version="1.0" ?><quiz>#QUESTIONS#</quiz>';
    
    var questionXMLString = '<question type="#TYPE#">'
                            +'<name><text>#QNAME#</text></name>'
                            +'<questiontext format="html"><text>#QTEXT#</text></questiontext>'
                            +'#ANSWERS#'
                            +'#PARAMS#'
                            +'</question>';
    var mcParamXMLString = '<shuffleanswers>#SHUFFLE#</shuffleanswers>'
                            +'<single>#SINGLE#</single>'
                            +'<answernumbering>#ANUMBERING#</answernumbering>';
                            
                            
    var answerXMLString = '<answer fraction="#PERCENT#">'
                            +'<text>#ANSWERTEXT#</text>'
                            +'<feedback><text>#FEEDBACK#</text></feedback>'
                            +'</answer>';
     
    /*
     * Állomány kiválasztása
     */
    $("#filechoose").submit(function(evt) {
        //fájlnév kiolvasása
        var filename = $(":file").val().split('\\').pop();
        //állomány betöltése
        $( "#sourcefile" ).load( filename, parseHTML);
        //formküldés megakadályozása
        evt.preventDefault();
    });
    
    
    /*
     * Állomány feldolgozása
     */
    function parseMC() {
        
        var questions = [];
        var scoringMethod = $( "#settings input:radio[name=percentcategory]:checked" ).val(); //pontozási metódus
        
        //Kigyűjtjük az össze Feleletvlasztskrds osztállyal rendelkező elemet 
        var $mcTestQs = $("#sourcefile .Feleletvlasztskrds");

        //Végigmegyünk mindegyik leválogatott elemen.
        $mcTestQs.each(function(i) {
            var question = {};  //Kérdés objektum létrehozása
            question.type = "multichoice";
            question.name = ($(this).text()).substring(0,200)+"("+i+")"; //kérdés neve = szövegével
            question.text = $(this).text(); //kérdés szövege
            question.wrongAnswer = []; //rossz válaszok tömbje
            question.rightAnswer = []; //jó válaszok tömbje
            question.rightAnswerPercent = 0;
            question.wrongAnswerPercent = 0;

            //leválogatjuk az összes elemet a következõ feletválasztós kérdésig
            //(veszõvel lehetnek felsorolni a lehetséges következõ kérdéssablont)
            var $qAnswers = $(this).nextUntil("#sourcefile .Feleletvlasztskrds");

            //a kapott eredményben végigmegyünk a rossz válaszokat kigyûjtjük a tömbbe
            $qAnswers.filter("#sourcefile .FeleletvlasztsROSSZ").each(function() {
                if($(this).text() != "") question.wrongAnswer.push($(this).text()); //ha nem üres, akkor rakja be
            });
            //a kapott eredményben végigmegyünk a jó válaszokat kigyûjtjük a tömbbe
            $qAnswers.filter("#sourcefile .FeleletvlasztsHELYES").each(function() {
                 if($(this).text() != "") question.rightAnswer.push($(this).text()); //ha nem üres, akkor rakja be
            });
            
            var rightAnswerNumber = question.rightAnswer.length; //helyes válaszok száma
            var wrongAnswerNumber = question.wrongAnswer.length; //helytelen válaszok száma
            
            //Helyes válaszok kérdéspontok igazítása a lenyíló listákhoz. (Csak 10 darab válaszig oké)
            switch (Math.floor(rightAnswerNumber)) {
                case 3:
                    question.rightAnswerPercent = 33.333;
                    break;
                case 6:
                    question.rightAnswerPercent = 16.666;
                    break;
                case 7:
                    question.rightAnswerPercent = 14.2857;
                    break;
                case 8:
                    question.rightAnswerPercent = 12.5;
                    break;
                case 9:
                    question.rightAnswerPercent = 11.111;
                    break;
                default:
                    question.rightAnswerPercent = 100/rightAnswerNumber;
            }
            
            //Helytelen válaszok kérdéspontok igazítása a lenyíló listákhoz. (Csak 10 darab válaszig oké)
            if (scoringMethod == "strict") {
                switch (Math.floor(wrongAnswerNumber)) {
                    case 3:
                        question.wrongAnswerPercent = -33.333;
                        break;
                    case 6:
                        question.wrongAnswerPercent = -16.666;
                        break;
                    case 7:
                        question.wrongAnswerPercent = -14.2857;
                        break;
                    case 8:
                        question.wrongAnswerPercent = -12.5;
                        break;
                    case 9:
                        question.wrongAnswerPercent = -11.111;
                        break;
                    default:
                            question.wrongAnswerPercent = -100/wrongAnswerNumber;
                }
            }else{
                question.wrongAnswerPercent = 0;
            }
            
            questions.push(question);
        });
        
        var currentQuestionsXMLSting = '';

        for(var i=0; i<questions.length; i++){
            //Adott kérdés paraméterezése a sablon alapján
            var currentQuestionXMLString = questionXMLString;
            currentQuestionXMLString = currentQuestionXMLString.replace("#TYPE#", questions[i].type);
            currentQuestionXMLString = currentQuestionXMLString.replace("#QNAME#", questions[i].name);
            currentQuestionXMLString = currentQuestionXMLString.replace("#QTEXT#", questions[i].text);
            var currentAnswersXMLString = '';  //Válaszok xml üresre
            var currentParamXMLString = ''; //Paraméterek xml üresre
            //Helyes válaszok felvétele
            for (var j=0; j < questions[i].rightAnswer.length; j++){
                var currentAnswerXMLString = answerXMLString;
                currentAnswerXMLString = currentAnswerXMLString.replace("#ANSWERTEXT#", questions[i].rightAnswer[j]);
                currentAnswerXMLString = currentAnswerXMLString.replace("#FEEDBACK#", "Helyes válasz");
                currentAnswerXMLString = currentAnswerXMLString.replace("#PERCENT#", questions[i].rightAnswerPercent);
                currentAnswersXMLString += currentAnswerXMLString;
            }
            //Helytelen válaszok felvétele
            for (var j=0; j < questions[i].wrongAnswer.length; j++){
                var currentAnswerXMLString = answerXMLString;
                currentAnswerXMLString = currentAnswerXMLString.replace("#ANSWERTEXT#", questions[i].wrongAnswer[j]);
                currentAnswerXMLString = currentAnswerXMLString.replace("#FEEDBACK#", "Helytelen válasz");
                currentAnswerXMLString = currentAnswerXMLString.replace("#PERCENT#", questions[i].wrongAnswerPercent );
                currentAnswersXMLString += currentAnswerXMLString;
            }
            
            //Kiegészítő paraméterek felvétele
            currentParamXMLString = mcParamXMLString;
            currentParamXMLString = currentParamXMLString.replace("#SHUFFLE#", 1);
            currentParamXMLString = currentParamXMLString.replace("#SINGLE#", questions[i].rightAnswer.length == 1 ? "true" : "false");
            currentParamXMLString = currentParamXMLString.replace("#ANUMBERING#", "none");
            
            //Kérdések xml szakasz hozzásadása a teljes mintához
            currentQuestionXMLString = currentQuestionXMLString.replace("#ANSWERS#", currentAnswersXMLString);
            //Paraméterek xml szakasz hozzásadása a teljes mintához
            currentQuestionXMLString = currentQuestionXMLString.replace("#PARAMS#", currentParamXMLString);
            //Összes kérdés összerakása
            currentQuestionsXMLSting += currentQuestionXMLString;
        }
        return currentQuestionsXMLSting;
    }
    
    
    function parseTF(){
        var $trueTestQs = $("#sourcefile .lltsIGAZ"); //Igaz állítások kigyűjtése
        var $falseTestQs = $("#sourcefile .lltsHAMIS"); //Hamis állítások kigyűjtése
        var tfQuestions = [];
        $trueTestQs.each(function(i) {
            var question = {};  //Kérdés objektum létrehozása
            question.type = "truefalse";
            question.name = ($(this).text()).substring(0,200)+"("+i+")"; //kérdés neve = szövegével
            question.text = $(this).text(); //kérdés szövege
            question.answer = "true"; // Helyes válasz
            tfQuestions.push(question);
        });
        $falseTestQs.each(function(i) {
            var question = {};  //Kérdés objektum létrehozása
            question.type = "truefalse";
            question.name = ($(this).text()).substring(0,200)+"("+i+")"; //kérdés neve = szövegével
            question.text = $(this).text(); //kérdés szövege
            question.answer = "false"; // Helyes válasz
            tfQuestions.push(question);
        });
        
        var currentQuestionsXMLSting = '';
        
        //Álítások felvétele
        for (var i=0; i < tfQuestions.length; i++){
            //Adott kérdés paraméterezése a sablon alapján
            var currentQuestionXMLString = questionXMLString;
            currentQuestionXMLString = currentQuestionXMLString.replace("#TYPE#", tfQuestions[i].type);
            currentQuestionXMLString = currentQuestionXMLString.replace("#QNAME#", tfQuestions[i].name);
            currentQuestionXMLString = currentQuestionXMLString.replace("#QTEXT#", tfQuestions[i].text);
            var currentAnswersXMLString = '';  //Válaszok xml üresre
            var currentParamXMLString = ''; //Paraméterek xml üresre
            var currentAnswerXMLString1 = answerXMLString;
            var currentAnswerXMLString2 = answerXMLString;
            if(tfQuestions[i].answer == "true") {
                currentAnswerXMLString1 = currentAnswerXMLString1.replace("#ANSWERTEXT#", "true");
                currentAnswerXMLString1 = currentAnswerXMLString1.replace("#FEEDBACK#", "Helyes válasz");
                currentAnswerXMLString1 = currentAnswerXMLString1.replace("#PERCENT#", "100");
                currentAnswerXMLString2 = currentAnswerXMLString2.replace("#ANSWERTEXT#", "false");
                currentAnswerXMLString2 = currentAnswerXMLString2.replace("#FEEDBACK#", "Helytelen válasz");
                currentAnswerXMLString2 = currentAnswerXMLString2.replace("#PERCENT#", "0");   
            }else{
                currentAnswerXMLString1 = currentAnswerXMLString1.replace("#ANSWERTEXT#", "true");
                currentAnswerXMLString1 = currentAnswerXMLString1.replace("#FEEDBACK#", "Helytelen válasz");
                currentAnswerXMLString1 = currentAnswerXMLString1.replace("#PERCENT#", "0");
                currentAnswerXMLString2 = currentAnswerXMLString2.replace("#ANSWERTEXT#", "false");
                currentAnswerXMLString2 = currentAnswerXMLString2.replace("#FEEDBACK#", "Helyes válasz");
                currentAnswerXMLString2 = currentAnswerXMLString2.replace("#PERCENT#", "100"); 
            }
            //Kérdések xml szakasz hozzásadása a teljes mintához
            currentQuestionXMLString = currentQuestionXMLString.replace("#ANSWERS#", currentAnswerXMLString1+currentAnswerXMLString2);
            //Paraméterek xml szakasz hozzásadása a teljes mintához
            currentQuestionXMLString = currentQuestionXMLString.replace("#PARAMS#", currentParamXMLString);
            //Összes kérdés összerakása
            currentQuestionsXMLSting += currentQuestionXMLString;
        }
        return currentQuestionsXMLSting;
    }

    function parseHTML(){
        $("#sourcefile" ).html($("#sourcefile" ).html().replace(/&nbsp;/g, ''));
        
        var allQuestionString = ''; //Összes kérdés sztringje
        var mcQuestions = parseMC(); //MC kérdések sztringje
        var tfQuestions = parseTF(); //TF kérdések sztringje
        //Összes kérdésszting összerakása
        if (mcQuestions) allQuestionString += mcQuestions;
        if (tfQuestions) allQuestionString += tfQuestions;
        
        //Végleges xmlsztring összerakása
        var currentQuizXMLString = quizXMLString;
        currentQuizXMLString =  currentQuizXMLString.replace("#QUESTIONS#",  allQuestionString);
        
        currentQuizXMLString = currentQuizXMLString.replace(/[\n\r]/g, ' ');

        //végső xml kirakása a szövegdobozba
        $("#xmlCode").text(currentQuizXMLString);
    }
 
    
});