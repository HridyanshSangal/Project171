var orderNumber = null
AFRAME.registerComponent('marker-handler',{
    init: async function(){
         //Get Table Number
    if (orderNumber === null) {
        this.askorderNumber();
      }
      //Get the toys collection
      var toys = await this.getToys();

        this.el.addEventListener('markerFound',()=>{
            if (orderNumber !== null) {
                var markerId = this.el.id;
                this.handleMarkerFound(toys, markerId);
              }
        })
        this.el.addEventListener('markerLost', ()=>{
            this.handleMarkerLost()
        })
    },
    askOrderNumber: function () {
        var iconUrl = "https://cdn-icons-png.flaticon.com/512/2421/2421855.png";
        swal({
          title: "Welcome to Toy Shop!!",
          icon: iconUrl,
          content: {
            element: "input",
            attributes: {
              placeholder: "Type your uid",
              type: "number",
              min: 1
            }
          },
          closeOnClickOutside: false,
        }).then(inputValue => {
          orderNumber = inputValue;
        });
      },
    handleMarkerFound: function(toys,markerId){
      var todaysDate = new Date();
    var todaysDay = todaysDate.getDay();

    // sunday - saturday : 0 - 6
    var days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday"
    ];

    //Get the toy based on ID
    var toy = toys.filter(toy => toy.id === markerId)[0];

    //Check if the toy is available today
    if (toys.unavailable_days.includes(days[todaysDay])) {
      swal({
        icon: "warning",
        title: toy.toy_name.toUpperCase(),
        text: "This toy is not available today!!!",
        timer: 2500,
        buttons: false
      });
    } else {
      //Changing Model scale to initial scale
      var model = document.querySelector(`#model-${toy.id}`);
      model.setAttribute("position", toy.model_geometry.position);
      model.setAttribute("rotation", toy.model_geometry.rotation);
      model.setAttribute("scale", toy.model_geometry.scale);

      //Update UI conent VISIBILITY of AR scene(MODEL , INGREDIENTS & PRICE)      
      model.setAttribute("visible", true);

      var descriptionContainer = document.querySelector(`#main-plane-${toy.id}`);
      descriptionContainer.setAttribute("visible", true);

      var priceplane = document.querySelector(`#price-plane-${toy.id}`);
      priceplane.setAttribute("visible", true)

        var buttonDiv = document.getElementById('button-div')
        buttonDiv.style.display = 'flex'
        var orderButton = document.getElementById('order-button')
        var orderSummaryButton = document.getElementById('order-summary-button')
        orderButton.addEventListener('click',()=>{
          var uid;
          orderNumber <= 9 ? (uid = `U0${orderNumber}`) : `U${orderNumber}`;
          this.handleOrder(uid, toy);
            swal({
                icon: 'https://i.imgur.com/4NZ6uLY.jpeg',
                title: 'Thanks For Order!',
                text: ' ',
                timer:2000,
                buttons: false
            })
        })
        orderSummaryButton.addEventListener('click',()=>{
            swal({
                icon: 'warning',
                title: 'Order Summary',
                text: 'Work in Progress'
            })
        })
    }
  },
    handleOrder: function (uid, toy) {
        // Reading current table order details
        firebase
          .firestore()
          .collection("users")
          .doc(uid)
          .get()
          .then(doc => {
            var details = doc.data();
    
            if (details["current_orders"][toy.id]) {
              // Increasing Current Quantity
              details["current_orders"][toy.id]["quantity"] += 1;
    
              //Calculating Subtotal of item
              var currentQuantity = details["current_orders"][toy.id]["quantity"];
    
              details["current_orders"][toy.id]["subtotal"] =
                currentQuantity * toy.price;
            } else {
              details["current_orders"][toy.id] = {
                item: toy.toy_name,
                price: toy.price,
                quantity: 1,
                subtotal: toy.price * 1
              };
            }
    
            details.total_bill += toy.price;
    
            //Updating db
            firebase
              .firestore()
              .collection("users")
              .doc(doc.id)
              .update(details);
          });
      },
      getAllToys: async function() {
        return await firebase
          .firestore()
          .collection("toys")
          .get()
          .then(snap => {
            return snap.docs.map(doc => doc.data());
          });
      },
    handleMarkerLost: function(){
        var buttonDiv = document.getElementById('button-div')
        buttonDiv.style.display = 'none'
    }
})