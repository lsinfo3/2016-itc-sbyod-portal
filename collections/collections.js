//all onos byod services available
OnosServices = new Mongo.Collection("onosServices");
//all services a user is allowed to use
UserServices = new Mongo.Collection("userServices");

// allow modification of collection fields
UserServices.allow({
   update: function (userId, doc, fields, modifier) {
   // users can only modify their own user object
   if(doc.user === userId)
   {
      UserServices.update({_id: doc._id}, modifier);
      return true;
    } else {
      return false;
    }
  }
});
