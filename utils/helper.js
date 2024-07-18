const createBlog = async (page, title, author, url) => {
  await page.getByRole('button', { name: 'add blog' }).click();
  const formInputs = await page.getByRole('textbox').all();
  await formInputs[0].fill(title);
  await formInputs[1].fill(author);
  await formInputs[2].fill(url);
  await page.getByRole('button', { name: 'create' }).click();
};

const extractLikes = async(page) => {
  const likesElement = await page.getByText(/likes \d+/);
  const initialLikesText = await likesElement.innerText();
  const initialLikes = Number(initialLikesText.match(/likes (\d+)/)[1]);
  return initialLikes;
};

const addLikes = async(page, likes) => {
  while(likes--){
    const initialLikes = await extractLikes(page);
    await page.getByRole('button', { name: 'like' }).click();
    await page.getByText(`likes ${initialLikes+1}`).waitFor();
    const updatedLikes = await extractLikes(page);
    //console.log('likes are', updatedLikes);
    if(updatedLikes !== initialLikes + 1){
      throw new Error('Likes not updated');
    };
  }
};

module.exports = {
  createBlog,
  extractLikes,
  addLikes
};