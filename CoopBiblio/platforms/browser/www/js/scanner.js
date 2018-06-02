var titreLivre;
var nomEmp;
var dateRemise;
var lienPhotoLivre;
var listeRemises = [];
var db;
var renderBookList = $('#books-detail > ul');

function recupererLivre() {
    "use strict";
    
    db = new AWS.DynamoDB();
    
    try {
        if (window.tinyHippos) {} 
        else {
            cordova.plugins.barcodeScanner.scan(
                function (result) {
                    if(!result.cancelled)
                    {
                        var str = result.text;
                        var res = str.split("-");
                        if(res[0]=="L"){
                            var idLivre = parseInt(res[1]);
                            db.scan({ TableName: 'Emprunt' }, emprunt = function(err, data) {
                                var existe = false;
                                for (var i = 0; i < data.Items.length; i++) {
                                    var src = data.Items[i];
                                    var idL = parseInt(src.CodeLivre.N);
                                    var idMembre = parseInt(src.CodeMembre.N);
                                     // var idMembre = parseInt(src.CodeMembre.N);
                                    if(idL === idLivre){
                                        existe = true;
                                        dateRemise = src.DateRendu.S;
                                        db.getItem({TableName: 'Livre', Key:{'Code': {'N' : idLivre.toString()}}}, 
                                            function(err3, data3) 
                                            {  
                                                if(data3.Item == null)
                                                {
                                                    alert ("Il n'y a pas de livre correspondant à ce code barre.");
                                                }
                                                else
                                                {
                                                    titreLivre = data3.Item.Titre.S;
                                                    lienPhotoLivre = data3.Item.Photo.S;
                                                }
                                            }
                                        );
                                        db.getItem({TableName: 'Membre', Key:{'Code': {'N' : idMembre.toString()}}}, 
                                            function(err3, data3) 
                                            {  
                                                nomEmp = data3.Item.Prenom.S + " " + data3.Item.Nom.S;
                                            }
                                        );
                                        setTimeout(function(){
                                            var jsonObj = [];
                                            var item = {};
                                            item ["idLivre"] = idLivre.toString();
                                            item ["photo"] = lienPhotoLivre;
                                            item ["titre"] = titreLivre;
                                            item ["idMembre"] = idMembre.toString();
                                            item ["membre"] = nomEmp;
                                            item ["dateRendu"] = dateRemise;
                                            jsonObj.push(item);
                                            listeRemises.push(item);
                                            afficherLivreARendre(jsonObj);
                                            i = data.Items.length - 1; 
                                        },500);
                                          
                                    }
                                }
                                if(existe==false)
                                {
                                    alert ("Ce livre n'est pas emprunté.");
                                }
                            });
                        }
                        else
                        {
                           navigator.notification.alert("Le code scanné n'est pas celui d'un livre !", function() {}, "Mauvais code barre", "OK"); 
                        }
                    }
                },
                function (error) {
                    alert("Scanning failed: " + error);
                }
            );
        }
    } catch (e) {}
}

function afficherLivreARendre(livreRendre){
    for(var i in livreRendre){
       renderBookList.prepend('<li><img class="book-image" src="' + livreRendre[livreRendre.length-i-1].photo + '"><div class="book-info"><span class="book-title">' + livreRendre[livreRendre.length-i-1].titre + '</span><br><span class="loanee-name">' + livreRendre[livreRendre.length-i-1].membre + '</span><br><span class="loan-date">' + livreRendre[livreRendre.length-i-1].dateRendu + '</span></i></div></li>');
    }
    $("#validerRendu").show();
}

function validerRetour() {
   var message = "Etes-vous sur de valider vos actions ?";
   var title = "VALIDER";
   var buttonLabels = "OUI,NON";
    
   navigator.notification.confirm(message, confirmCallback, title, buttonLabels);

   function confirmCallback(buttonIndex) {
       if(buttonIndex == 1){
            for(var i in listeRemises){
                var codeLiv = listeRemises[i].idLivre.toString();
                var codeMem = listeRemises[i].idMembre.toString();
                var dateRem = listeRemises[i].dateRendu.toString();
                var tabName = "Emprunt";
                var params = {
                    TableName:tabName,
                    Key:{
                        'CodeMembre': { 'N': codeMem },
                        'CodeLivre': { 'N': codeLiv}
                    }
                };
                db.deleteItem(params, function(err, data) {
                    renderBookList.empty();
                    $("#validerRendu").hide();
                });
            }
        AfficherListe();
        }
    }  
}