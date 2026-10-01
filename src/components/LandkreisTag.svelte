<script>
  import plzConfig from '../../config/region10-plz.json';
  let { kreis } = $props();
</script>

<span class="lk" style="--farbe: var(--lk-{kreis})" title={plzConfig.landkreise[kreis]}>
  <span class="punkt" aria-hidden="true"></span>{kreis}
</span>

<style>
  .lk {
    display: inline-flex; align-items: center; gap: 0.3em;
    background: var(--farbe); color: #fff; font-weight: 700; font-size: 0.85rem;
    padding: 0.15em 0.5em; border-radius: 6px; line-height: 1.3; letter-spacing: 0.03em;
  }
  .punkt { width: 0.5em; height: 0.5em; border-radius: 50%; background: #fff; }
</style>
