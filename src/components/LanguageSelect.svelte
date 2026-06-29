<script lang="ts">
  import { t, type LangSetting } from "../lib/i18n";
  import { settings, setLanguage } from "../lib/stores";

  function onChange(e: Event) {
    const value = (e.currentTarget as HTMLSelectElement).value as LangSetting;
    void setLanguage(value);
  }
</script>

<div class="form-group">
  <label for="language-select">{$t("settings.language")}</label>
  <select id="language-select" value={$settings.language} onchange={onChange}>
    <option value="auto">{$t("settings.langAuto")}</option>
    <option value="ja">{$t("settings.langJa")}</option>
    <option value="en">{$t("settings.langEn")}</option>
  </select>
</div>
