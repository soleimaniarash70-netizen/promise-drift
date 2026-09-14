import { formattingSettings } from 'powerbi-visuals-utils-formattingmodel';
class DisplayCard extends formattingSettings.SimpleCard {
 name = 'display'; displayName = 'Display / نمایش';
 rtl = new formattingSettings.ToggleSwitch({name:'rtl',displayName:'Right to left / راست‌به‌چپ',value:true});
 persian = new formattingSettings.ToggleSwitch({name:'persian',displayName:'Persian calendar / تاریخ شمسی',value:true});
 slices = [this.rtl,this.persian];
}
export class Settings extends formattingSettings.Model { display = new DisplayCard(); cards=[this.display]; }
