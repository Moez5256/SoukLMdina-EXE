$("#scanLivre").hide();
var idMembre;
var dateRenduString;

//Verifie si un livre est déjà emprunté ou non.
function existeEmprunt(items, codelivre){
    existe = false;
    for (var i in items)
    {
        if(items[i].codeLivre==codelivre)
        {
            existe =true;
        }
    }
    return existe;
}

//Verifie si unlivre est scanné, l'ajoute à la table d'emprunt et l'affiche
function livreEmprunt() {
    "use strict";
    var db = new AWS.DynamoDB();
    try {
        cordova.plugins.barcodeScanner.scan(
            function (result) {
                if(!result.cancelled)
                {
                    var str = result.text;
                    var res = str.split("-");
                    if(res[0]=="L"){
                        var idLivre = parseInt(res[1]);
                        if(existeEmprunt(items,idLivre))
                        {
                            navigator.notification.alert("Le livre scanné est déjà emprunté !", function() {}, "Emprunt impossible", "OK");
                        }
                        else
                        {
                            db.getItem({TableName: 'Livre', Key:{'Code': {'N' : idLivre.toString()}}}, 
                                function(err, data3) 
                                {  
                                    if(data3.Item == null)
                                        navigator.notification.alert("Ce livre n'existe pas !", function() {}, "Livre inconnu", "OK");
                                    else
                                    {
                                        var titreLivre = data3.Item.Titre.S;
                                        var auteurLivre = data3.Item.Auteur.S;
                                        var lienPhotoLivre = data3.Item.Photo.S;
                                        $('<li><img class="book-image" src="' + lienPhotoLivre + '"><div class="book-info"><span class="book-title">' + titreLivre + '</span><br><span class="book-auteur">' + auteurLivre + '</span></div></li>').prependTo('#emprunt-books > ul');
                                        db.putItem({
                                            TableName: "Emprunt",
                                            Item: {
                                                'CodeMembre': {'N': idMembre.toString()},
                                                'CodeLivre': {'N': idLivre.toString()},
                                                'DateRendu': {'S': dateRenduString}
                                            }
                                        },
                                        function(err, data)
                                        {
                                            if(err)
                                            $("#erreur").append(err);
                                        }
                                        );
                                        AfficherListe();
                                    }
                                }
                            );
                        }
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
    } catch (e) {}
}



//Verifie si ce membre existe et l'affiche
function recupererMembre() {
    var db = new AWS.DynamoDB();
    try {
        cordova.plugins.barcodeScanner.scan(
            function (result) {
                if(!result.cancelled)
                {
                    var str = result.text;
                    var res = str.split("-");
                    if(res[0]=="M"){
                        idMembre = parseInt(res[1]);$
                        var nomEmp;
                        db.getItem({TableName: 'Membre', Key:{'Code': {'N' : idMembre.toString()}}}, 
                            function(err3, data3) 
                            {  
                                if (data3.Item == null)
                                {
                                    navigator.notification.alert("Ce membre n'existe pas !", function() {}, "Membre inconnu", "OK");
                                }
                                else
                                {
                                    nomEmp = data3.Item.Prenom.S + " " + data3.Item.Nom.S;
                                    $("#nom_emprunteur").append("<font size='3'><b>Emprunteur</b> : "+nomEmp+"<font>");
                                    var dateRendu = new Date();
                                    dateRendu.setDate(dateRendu.getDate()+14);
                                    dateMois = dateRendu.getMonth() + 1;
                                    if (dateMois<10)
                                    {
                                        dateMois = "0"+dateMois;
                                    }
                                    dateJour = dateRendu.getDate();
                                    if (dateJour<10)
                                    {
                                        dateJour = "0"+dateJour;
                                    }
                                    dateRenduString = dateJour + "/" + dateMois + "/" + dateRendu.getFullYear();
                                    $("#date_retour").append("<font size='3'><b>Date de rendu des livres</b> : "+dateRenduString+"<font>");
                                    $("#scanMembre").hide();
                                    $("#scanLivre").show();
                                }
                            }
                        );
                    } 
                    else
                    {
                        navigator.notification.alert("Le code scanné n'est pas celui d'un membre !", function() {}, "Mauvais code barre", "OK");
                    }
                }
            },
            function (error) {
                alert("Scanning failed: " + error);
            }
        );
    } catch (e) {}
}

//Demande si on veut terminer l'emprunt pour le membre en cours
function validerEmprunt() {
    var message = "Etes-vous sur de valider vos actions ?";
    var title = "Terminer emprunts du memebre";
    var buttonLabels = "OUI,NON";
    function confirmCallback(buttonIndex) {
        if(buttonIndex == 1){
            $("#scanMembre").show();
            $("#scanLivre").hide();
            $("#nom_emprunteur").empty();
            $("#date_retour").empty();
            $('#emprunt-books > ul').empty();
        }
    }
    navigator.notification.confirm(message, confirmCallback, title, buttonLabels);
}