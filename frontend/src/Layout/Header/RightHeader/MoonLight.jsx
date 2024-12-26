import React, { useContext, useEffect, useState } from 'react';
import SvgIcon from '../../../Components/Common/Component/SvgIcon';
import CustomizerContext from '../../../_helper/Customizer';

const MoonLight = () => {
  const { addMixBackgroundLayout } = useContext(CustomizerContext);
  const [moonlight, setMoonlight] = useState(false);

  const MoonlightToggle = (light) => {
    if (light) {
      addMixBackgroundLayout('light-only');
      document.body.className = 'light-only';
      localStorage.setItem('theme', 'light-only');
      setMoonlight(false);
    } else {
      addMixBackgroundLayout('dark-only');
      document.body.className = 'dark-only';
      localStorage.setItem('theme', 'dark-only');
      setMoonlight(true);
    }
  };

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      if (storedTheme === 'light-only') {
        addMixBackgroundLayout('light-only');
        document.body.className = 'light-only';
        setMoonlight(false);
      } else if (storedTheme === 'dark-only') {
        addMixBackgroundLayout('dark-only');
        document.body.className = 'dark-only';
        setMoonlight(true);
      }
    }
  }, [addMixBackgroundLayout]);

  return (
    <li>
      <div className={`mode ${moonlight && 'active'}`} onClick={() => MoonlightToggle(moonlight)}>
        <SvgIcon iconId={'moon'} />
      </div>
    </li>
  );
};

export default MoonLight;
