import "../sass/style.scss";

import { $, $$ } from "./modules/bling";

import typeAhead from "./modules/typeAhead";
import autoComplete from "./modules/autoComplete";

autoComplete($("#address"), $("#lat"), $("#lng"));

typeAhead($(".search"));
