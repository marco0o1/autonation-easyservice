<script>
  let user_image = "images/user.png";
  let autonation_logo = "images/autonation_logo.png";
  let available = false;
</script>

<style>
  .wrapper {
    margin-top: 2em;
    display: flex;
    flex-direction: column;
    border-bottom: 3px #b7b7b7 solid;
  }
  .wrapper_top {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  .user_information {
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  .user_information img {
    margin: 0 2em;
    width: 6em;
    height: 6em;
    border-radius: 50%;
    background-color: #ef4985;
  }

  .information {
    display: flex;
    flex-direction: column;
  }

  .available {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .available input[type="checkbox"] {
    transform: scale(4);
  }

  .logo_image img {
    height: 3em;
  }

  .wrapper_bottom {
    width: 100%;
    height: 2.5em;
    display: flex;
    justify-content: flex-end;
  }
</style>

<div class="wrapper">
  <div class="wrapper_top">
    <div class="user_information">
      <img src={user_image} alt="user" />
      <div class="information">
        <h3>Advisor Name</h3>
        <div class="available">
          <h4>Available</h4>
          <label> <input type="checkbox" bind:checked={available} /></label>
        </div>
      </div>
    </div>
    <div class="logo_image">
      <img src={autonation_logo} alt="autonation logo" />
    </div>
  </div>
  <div class="wrapper_bottom">
    <h5>Arriving Clients</h5>
  </div>
</div>
