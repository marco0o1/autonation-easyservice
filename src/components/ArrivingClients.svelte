<script>
  import ClientInf from "./ClientInf.svelte";
</script>

<style>
  .wrapper {
    display: flex;
    flex-direction: column;
  }
</style>

  <div class="wrapper">
    <ClientInf
      name={'Damian Marley'}
      plate={'KGZ-A53'}
      history={'Traded a Subaru for a FerrariPerformed Engine Replacement'} />
    <ClientInf
      name={'Tim Cook'}
      plate={'AFW-G53'}
      history={'Traded a Corolla for a PorscheRequested a Refund for his Corolla'} />
    <ClientInf name={'Percy Jackson'} plate={'AFW-G53'} history={'Is pro'} />
  </div>

