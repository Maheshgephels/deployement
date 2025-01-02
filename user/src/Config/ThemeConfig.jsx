export class ConfigDB {
  static data = {
    settings: {
      layout_type: 'ltr',
      sidebar: {
        type: 'compact-wrapper',
        iconType: 'stroke-svg',
      },
      sidebar_setting: 'default-sidebar',
    },
    color: {
      primary_color: localStorage.getItem('Userdefault_color') || '#7366ff',
      secondary_color: localStorage.getItem('Usersecondary_color') || '#f73164',
      mix_background_layout: 'light-only',
    },
    router_animation: 'fadeIn',
  };
}
export default ConfigDB;
