import { Setlist } from "./setlist";
import { SetlistPrintSettings } from "./setlist-print-settings";

export interface AccountSetlistPrintSettings {
  accountId?: string;
  setlist : Setlist;
  printSettings: SetlistPrintSettings;
}
