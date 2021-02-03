import "../sass/style.scss";

import { $, $$ } from "./modules/bling";

import typeAhead from "./modules/typeAhead";
import autoComplete from "./modules/autoComplete";
import makeMap from "./modules/map";

autoComplete($("#address"), $("#lat"), $("#lng"));

typeAhead($(".search"));

makeMap($("#map"));
