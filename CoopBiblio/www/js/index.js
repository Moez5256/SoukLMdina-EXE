var app = {
    initialize: function() {
        this.bindEvents();
    },
    bindEvents: function() {
        $(document).on('deviceready', this.onDeviceReady);
    },
    onDeviceReady: function() {
        window.location.hash = "list";
        
        if (navigator.connection.type.toString() == "none")
        {
            alert("Vous n'êtes pas connecté à Internet");
        }                      
    } 
}; 

var emprunts;
window.onhashchange = function() {
    if(window.location.hash == '#list') {
        $('#list-view').show();
        $('#list-view').removeClass('mode-detail');
    }

    var book = window.location.hash.substring(1);
    if(book == 'list'){ 
        book = $('#emprunt-master ul li').first().attr('data-book');
    }

    var masterElementSelected = $('#emprunt-master li[data-book=' + book +']');
    masterElementSelected.addClass('selected').siblings().removeClass('selected');

    var book = masterElementSelected.data('book');
    $('#emprunt-detail .book-image').attr('src', emprunts[book].livre.photo);
    $('#emprunt-detail .book-title').html(emprunts[book].livre.titre);
    $('#emprunt-detail .book-autor').html(emprunts[book].livre.auteur);
    $('#emprunt-detail .book-gendre').html(emprunts[book].livre.genre);
    $('#emprunt-detail .book-description').html(emprunts[book].livre.description);
    $('#emprunt-detail .loanee-prename').html(emprunts[book].membre.prenom);
    $('#emprunt-detail .loanee-name').html(emprunts[book].membre.nom);
    $('#emprunt-detail .loanee-mail').html(emprunts[book].membre.courriel);
    $('#emprunt-detail .loan-date').html(emprunts[book].dateRendu);

    if(window.location.hash != '#list') {
        $('#list-view').addClass('mode-detail');			
    }
    $('#emprunt-detail').scrollTop(0);
};


//Hook a swipe left to come back from the list detail
$("#emprunt-detail").on("swipeLeft", function(event) {
    window.location.hash = '#list';
});

$("#emprunt-detail").on("swipeRight", function(event) {
    window.location.hash = '#list';
});
        
var empruntList = $('#emprunt-master > ul');
var db = new AWS.DynamoDB();

//Permet de récupérer les informations pour un livre donné
var items = [];
function recuperationLivre(items,i)
{
    db.getItem({TableName: 'Livre', Key:{'Code': {'N' : items[i].codeLivre}}}, 
        function(err3, data3) 
        {  
            var src3 = data3.Item;
            items[i].livre.titre = src3.Titre.S;
            items[i].livre.genre = src3.Genre.S;
            items[i].livre.photo = src3.Photo.S;
            items[i].livre.auteur = src3.Auteur.S;
            items[i].livre.description = src3.Description.S;
        }
    );
}

//Permet de récupérer les informations pour un membre donné
function recuperationMembre(items,i)
{
    db.getItem({TableName: 'Membre', Key:{'Code': {'N' : items[i].codeMembre}}}, 
        function(err2, data2) 
        {  
            var src2 = data2.Item;
            items[i].membre.nom = src2.Nom.S;
            items[i].membre.prenom = src2.Prenom.S;
            items[i].membre.dateNaissance = src2.DateNaissance.S;
            items[i].membre.courriel = src2.Courriel.S;
        }
    );
}

//Permet de récupérer les informations pour tous les emprunts puis appel una fonction d'affichage.
function recuperationEmprunt(items)
{ ;
    db.scan({
        TableName: 'Emprunt'
    }, emprunt = function(err, data) {
        for (var i = 0; i < data.Items.length; i++) {
            document.getElementById("demo").innerHTML=""
            var src = data.Items[i];
            var item = new Object();
            item.livre = new Object();
            item.membre = new Object();
            item.dateRendu = src.DateRendu.S;
            item.codeLivre = src.CodeLivre.N;
            item.codeMembre = src.CodeMembre.N;
            items.push(item);
            recuperationMembre(items,i);
            recuperationLivre(items,i);
        }
        setTimeout(function(){trieEmprunt(items)},300);
    });
}


function trieEmprunt(emprunt)
{
    var myArray = [];
     empruntList.empty();
   
    emprunts = emprunt;
    doc=document.getElementById("search").value;
    document.getElementById("demo").innerHTML="Aucun résultat trouvé ...";
    
    element=document.getElementById("myselect").value.toString();
if (element!="null"){   
 if(element=="dateRendu")
   emprunt.sort(function(a,b) {return (a.dateRendu > b.dateRendu) ? 1 : ((b.dateRendu > a.dateRendu) ? -1 : 0);});
    if(element=="nom") emprunt.sort(function(a,b) {return (a.membre.nom > b.membre.nom) ? 1 : ((b.membre.nom > a.membre.nom) ? -1 : 0);});
    if(element=="nomLivre") emprunt.sort(function(a,b) {return (a.livre.titre > b.livre.titre) ? 1 : ((b.livre.titre > a.livre.titre) ? -1 : 0);});}
    var j=0;
    for (var i in emprunt)
    {    
        titreLivre=emprunt[i].livre.titre ;
        nom=emprunt[i].membre.nom;
        prenom=emprunt[i].membre.prenom;
        dateRendu=emprunt[i].dateRendu;
        nomprenom=(titreLivre+ " "+nom+" "+prenom+" "+dateRendu).toUpperCase();
        prenomnom=(titreLivre+ " "+prenom+" "+nom+" "+dateRendu).toUpperCase();
        text1=nomprenom.toUpperCase();
        text3=prenomnom.toUpperCase();
        text2=doc.toUpperCase();
        n = text1.indexOf(text2);
        n1= text3.indexOf(text2);

        if ((n>=0)||(n1>=0))
        {   
            myArray[j]=i;
            j=j+1;
            $('<li data-book="' + i + '"><img class="book-image" src="' + emprunt[i].livre.photo + '"><div class="book-info"><span class="book-title">' + emprunt[i].livre.titre + '</span><br><span class="loanee-name">' + emprunt[i].membre.prenom + ' ' + emprunt[i].membre.nom + '</span><br><span class="loan-date">' + emprunt[i].dateRendu + '</span></i></div></li>').appendTo(empruntList);
            document.getElementById("demo").innerHTML="";
            $('#emprunt-master li').click(function() {
                window.location.hash = $(this).attr('data-book');
            });
        }
    }
        
    var masterElementSelected = $('#emprunt-master li[data-book=' + myArray[0] +']');
    masterElementSelected.addClass('selected').siblings().removeClass('selected');
    $('#emprunt-detail .book-image').attr('src', emprunts[myArray[0]].livre.photo);
    $('#emprunt-detail .book-title').html(emprunts[myArray[0]].livre.titre);
    $('#emprunt-detail .book-autor').html(emprunts[myArray[0]].livre.auteur);
    $('#emprunt-detail .book-gendre').html(emprunts[myArray[0]].livre.genre);
    $('#emprunt-detail .book-description').html(emprunts[myArray[0]].livre.description);
    $('#emprunt-detail .loanee-prename').html(emprunts[myArray[0]].membre.prenom);
    $('#emprunt-detail .loanee-name').html(emprunts[myArray[0]].membre.nom);
    $('#emprunt-detail .loanee-mail').html(emprunts[myArray[0]].membre.courriel);
    $('#emprunt-detail .loan-date').html(emprunts[myArray[0]].dateRendu);
    
      
}

recuperationEmprunt(items);

function trierListe(){
    empruntList.empty();
    items=[];
    recuperationEmprunt(items);
}
        
function AfficherListe()
{
    empruntList.empty();
    items=[];
    recuperationEmprunt(items);
    document.getElementById("demo").innerHTML="";
}
app.initialize();