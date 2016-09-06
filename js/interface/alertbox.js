function alert(type, msg) {
  $('#alert-text').text(msg);
  var $alert = $('#alert');
  $alert.removeClass("alert-success alert-info alert-warning alert-danger");

  $alert.addClass("alert-"+type);
  $alert.removeClass('hidden');
  $alert.stop(true, true);
  $alert.fadeTo(4000, 500).slideUp(500, function() {
    $alert.addClass('hidden');
  });
  alert2(type, msg);
}
function alert2(type, msg) {
  $('#alert-text2').text(msg);
  var $alert = $('#alert2');
  $alert.removeClass("alert-success alert-info alert-warning alert-danger");

  $alert.addClass("alert-"+type);
  $alert.removeClass('hidden');
  $alert.stop(true, true);
  $alert.fadeTo(4000, 500).slideUp(500, function() {
    $alert.addClass('hidden');
  });
}