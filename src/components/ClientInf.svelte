<script>
  export let name;
  export let plate;
  export let history;
</script>

<style>
  .wrapper {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px #b7b7b7 solid;
  }
  .left {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1 1 0;
  }

  .left span {
    margin-bottom: 10px;
  }

  .left button {
    width: 8em;
    font-weight: 800;
    color: white;
    background-color: #EF4985;

  }

  .left button:hover {
    transform: scale(1.1);
    background-color: #F47CA8; 
  }

  .line {
    background-color: #B7B7B7;
    width: 2px;
    height: 80px;
    margin: 0 4em;
  }

  .right {
    display: flex;
    flex-direction: column;
    flex: 1 1 0;
  }


  
  .right span {
    text-align: initial;
  }
</style>

<div class="wrapper">
  <div class="left">
    <h3>{name}</h3>
    <span><stron>License Plate:</stron>
      {plate}</span>
    <button>Attend Now</button>
  </div>
  <div class="line"/>
  <div class="right">
    <h4>Recent History</h4>
    <span>{history}</span>
  </div>
</div>
